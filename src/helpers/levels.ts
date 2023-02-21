import { Level, LevelItem, ShipmentsMode, VisibleLevels } from "../types";
import { AppContext } from "../hooks/useAppContext";

export const getLevelIndex = (levelItems: LevelItem[], level: Level) =>
  levelItems.findIndex((item) => item.level === level);

export const getVisibleLevels = (levels: Level[]) =>
  levels.reduce((acc, level, i) => {
    acc[level] = i;
    return acc;
  }, {} as VisibleLevels);

export const fixupLevelItems = ({
  shipmentsMode,
  levelItems,
  setLevelItems,
  isFlattenSizes,
}: Pick<
  AppContext,
  "shipmentsMode" | "levelItems" | "setLevelItems" | "isFlattenSizes"
>) => {
  let baseIndex: number;
  let targetIndex: number;

  if (isFlattenSizes) {
    baseIndex = Math.max(
      getLevelIndex(levelItems, "shipment"),
      getLevelIndex(levelItems, "warehouse")
    );
    targetIndex = getLevelIndex(levelItems, "product");
  } else if (shipmentsMode === ShipmentsMode.LineItems) {
    // When `shipmentsMode` is LineItems, the shipment level cannot be higher than product or warehouse.
    baseIndex = Math.max(
      getLevelIndex(levelItems, "product"),
      getLevelIndex(levelItems, "warehouse")
    );
    targetIndex = getLevelIndex(levelItems, "shipment");
  }

  if (baseIndex > targetIndex && targetIndex >= 0) {
    const reordered = [...levelItems];
    const [shipmentItem] = reordered.splice(targetIndex, 1);
    reordered.splice(baseIndex, 0, shipmentItem);
    setLevelItems(reordered);
  }
};

export const isLevel = (level: Level, ...set: Level[]) => set.includes(level);

export const getLevelMeta = (
  levelItems: LevelItem[],
  level: number | Level,
  {
    shipmentsMode,
    isFlattenSizes,
  }: Pick<AppContext, "shipmentsMode" | "isFlattenSizes">
) => {
  const i =
    typeof level === "number" ? level : getLevelIndex(levelItems, level);
  if (typeof level === "number") {
    level = levelItems[level].level;
  }

  let checked = levelItems[i].visible;
  if (isFlattenSizes && isLevel(level, "sizeGroup")) {
    checked = false;
  }

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
        nextLevel !== "sizeGroup" &&
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
      upEnabled = upEnabled && prevLevel !== "product";
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
