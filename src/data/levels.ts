import { Level, LevelIndices, LevelItem, SelectableLevel } from "./types";
import { SizeGridContext } from "../hooks/useSizeGridContext";
import { allLevels } from "../constants";

export const getLevelItemIndex = (levelItems: LevelItem[], level: Level) =>
  levelItems.findIndex((item) => item.level === level);

export const getLevelIndices = (levels: Level[]) =>
  levels.reduce((acc, level, i) => {
    acc[level] = i;
    return acc;
  }, {} as LevelIndices);

export const getLevelItemIndices = (levelItems: LevelItem[]) =>
  levelItems.reduce((acc, { level }, i) => {
    acc[level] = i;
    return acc;
  }, {} as LevelIndices);

export const resolveDisplayLevels = ({
  levelItems,
  isFlattenSizes,
}: Pick<SizeGridContext, "levelItems" | "isFlattenSizes">) => {
  const result: Level[] = levelItems
    .filter((item, i) => {
      if (!item.visible) {
        return false;
      }
      switch (item.level) {
        case "sizeGroup": {
          const productLevelIndex = getLevelItemIndex(levelItems, "product");
          // return isFlattenSizes ? i < productLevelIndex : i > productLevelIndex;
          return !isFlattenSizes || i < productLevelIndex;
        }
      }
      return true;
    })
    .map((item) => item.level);

  if (!isFlattenSizes && result.at(-1) === "product") {
    result.push("sizes");
  }

  return result;
};

const reorderItem = (
  levelItems: LevelItem[],
  level: Level,
  relation: "above" | "below",
  relatedTo: Level[]
) => {
  const maxRelatedIndex = Math.max(
    ...relatedTo.map((item) => getLevelItemIndex(levelItems, item))
  );
  const targetIndex = getLevelItemIndex(levelItems, level);

  if (
    (relation === "below" && targetIndex < maxRelatedIndex) ||
    (relation === "above" && targetIndex > maxRelatedIndex)
  ) {
    const [targetItem] = levelItems.splice(targetIndex, 1);
    levelItems.splice(maxRelatedIndex, 0, targetItem);
  }
};

export const fixupLevelItems = ({
  levelItems,
  isFlattenSizes,
  isUseSizeGroups,
  dispatch,
}: Pick<SizeGridContext, "levelItems" | "isFlattenSizes" | "isUseSizeGroups"> &
  Partial<Pick<SizeGridContext, "dispatch">>) => {
  const resultItems: LevelItem[] = levelItems.slice();

  // in flatten-sizes mode, no levels can be beneath products
  if (isFlattenSizes) {
    reorderItem(resultItems, "product", "below", [
      "shipment",
      "warehouse",
      "sizeGroup",
    ]);
  }

  // when Size Groups are not used, turn off the sizeGroup level, if it's on
  const sizeGroupIndex = getLevelItemIndex(resultItems, "sizeGroup");
  if (!isUseSizeGroups && resultItems[sizeGroupIndex]?.visible) {
    resultItems[sizeGroupIndex] = {
      ...resultItems[sizeGroupIndex],
      visible: false,
    };
  }

  if (
    resultItems.some(
      (item, i) =>
        item.level !== levelItems[i].level ||
        item.visible !== levelItems[i].visible
    )
  ) {
    dispatch?.({ prop: "levelItems", payload: resultItems });
    return resultItems;
  }

  return levelItems;
};

export const isLevel = (level: Level, ...set: Level[]) => set.includes(level);

export const isSelectableLevel = (name: string): name is SelectableLevel =>
  allLevels.includes(name as SelectableLevel);

export const getLevelMeta = (
  levelItems: LevelItem[],
  level: number | Level,
  levelIndices: LevelIndices,
  {
    shipmentsMode,
    isFlattenSizes,
    isUseSizeGroups,
  }: Pick<
    SizeGridContext,
    "shipmentsMode" | "isFlattenSizes" | "isUseSizeGroups"
  >
) => {
  const i =
    typeof level === "number" ? level : getLevelItemIndex(levelItems, level);
  if (typeof level === "number") {
    level = levelItems[level].level;
  }

  let checked = level === "product" || levelItems[i].visible;
  let enabled =
    // product lvl is always checked and disabled
    level !== "product";

  const nextLevel = levelItems[i + 1]?.level;
  const prevLevel = levelItems[i - 1]?.level;

  let upEnabled = i > 0;
  let downEnabled = i < levelItems.length - 1;

  switch (level) {
    case "product":
      // in flatten-sizes mode, no levels can be beneath products
      upEnabled = upEnabled && !isFlattenSizes;
      break;
    case "warehouse":
      downEnabled = downEnabled && (!isFlattenSizes || nextLevel !== "product");
      break;
    case "shipment":
      downEnabled = downEnabled && (!isFlattenSizes || nextLevel !== "product");
      break;
    case "sizeGroup":
      enabled = enabled && isUseSizeGroups;
      // can be checked if flatten-sizes and above products
      checked =
        checked &&
        isUseSizeGroups &&
        (!isFlattenSizes || i < levelIndices.product);
      // upEnabled = upEnabled && prevLevel === "product" && isFlattenSizes;
      downEnabled = downEnabled && (!isFlattenSizes || nextLevel !== "product");
      break;
  }

  return { checked, enabled, upEnabled, downEnabled };
};

export const toggleLevelItem = (
  level: Level,
  visible: boolean,
  { levelItems, dispatch }: Pick<SizeGridContext, "levelItems" | "dispatch">
) => {
  if (level === "product" && !visible) {
    // console.warn("Cannot ungroup by product");
    return;
  }
  const items = levelItems.map((item) =>
    item.level === level ? { ...item, visible } : item
  );
  dispatch({ prop: "levelItems", payload: items });
};
