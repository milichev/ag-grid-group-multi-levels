import { Level, LevelItem, ShipmentsMode, LevelIndices } from "./types";
import { AppContext } from "../hooks/useAppContext";

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
}: Pick<AppContext, "levelItems" | "isFlattenSizes">) => {
  const result: Level[] = levelItems
    .filter((item, i) => {
      if (!item.visible) {
        return false;
      }
      switch (item.level) {
        case "sizeGroup": {
          const productLevelIndex = getLevelItemIndex(levelItems, "product");
          return isFlattenSizes ? i < productLevelIndex : i > productLevelIndex;
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
  shipmentsMode,
  levelItems,
  setLevelItems,
  isFlattenSizes,
}: Pick<AppContext, "shipmentsMode" | "levelItems" | "isFlattenSizes"> &
  Partial<Pick<AppContext, "setLevelItems">>) => {
  const resultItems: LevelItem[] = levelItems.slice();

  // in flatten-sizes mode, no levels can be beneath products
  if (isFlattenSizes) {
    reorderItem(resultItems, "product", "below", [
      "shipment",
      "warehouse",
      "sizeGroup",
    ]);
  }
  // when no flatten-sizes, a size group has meaning under its product
  else {
    reorderItem(resultItems, "sizeGroup", "below", ["product"]);
  }

  // when `shipmentsMode` is LineItems, the shipment level cannot be higher than product or warehouse.
  if (shipmentsMode === ShipmentsMode.LineItems) {
    reorderItem(resultItems, "shipment", "below", ["product", "warehouse"]);
  }

  if (resultItems.some((item, i) => item.level !== levelItems[i].level)) {
    setLevelItems?.(resultItems);
    return resultItems;
  }

  return levelItems;
};

export const isLevel = (level: Level, ...set: Level[]) => set.includes(level);

export const getLevelMeta = (
  levelItems: LevelItem[],
  level: number | Level,
  levelIndices: LevelIndices,
  {
    shipmentsMode,
    isFlattenSizes,
  }: Pick<AppContext, "shipmentsMode" | "isFlattenSizes">
) => {
  const i =
    typeof level === "number" ? level : getLevelItemIndex(levelItems, level);
  if (typeof level === "number") {
    level = levelItems[level].level;
  }

  let checked = levelItems[i].visible;
  const enabled =
    level !== "product" &&
    (!isFlattenSizes || isLevel(level, "product", "shipment", "warehouse"));
  let upEnabled = i > 0;
  let downEnabled = i < levelItems.length - 1;
  const nextLevel = levelItems[i + 1]?.level;
  const prevLevel = levelItems[i - 1]?.level;

  switch (level) {
    case "product":
      downEnabled =
        downEnabled &&
        // nextLevel !== "sizeGroup" &&
        (shipmentsMode === ShipmentsMode.BuildOrder ||
          nextLevel !== "shipment");
      upEnabled =
        upEnabled &&
        (!isFlattenSizes || !isLevel(prevLevel, "warehouse", "shipment"));
      break;
    case "warehouse":
      downEnabled =
        downEnabled &&
        (isFlattenSizes
          ? nextLevel !== "product"
          : shipmentsMode === ShipmentsMode.BuildOrder ||
            nextLevel !== "shipment");
      break;
    case "shipment":
      upEnabled =
        upEnabled &&
        (isFlattenSizes
          ? true
          : shipmentsMode === ShipmentsMode.BuildOrder ||
            !isLevel(prevLevel, "product", "warehouse"));
      downEnabled = downEnabled && (!isFlattenSizes || nextLevel !== "product");
      break;
    case "sizeGroup":
      checked = checked && isFlattenSizes === i < levelIndices.product;
      upEnabled = upEnabled && prevLevel === "product" && isFlattenSizes;
      downEnabled = downEnabled && nextLevel === "product" && !isFlattenSizes;
      break;
  }

  return { checked, enabled, upEnabled, downEnabled };
};

export const toggleLevelItem = (
  level: Level,
  visible: boolean,
  {
    levelItems,
    setLevelItems,
  }: Pick<AppContext, "levelItems" | "setLevelItems">
) => {
  if (level === "product" && !visible) {
    // console.warn("Cannot ungroup by product");
    return;
  }
  const items = levelItems.map((item) =>
    item.level === level ? { ...item, visible } : item
  );
  setLevelItems(items);
};
