import { ShipmentsMode, Level, LevelItem } from "../interfaces";
import { AppContext } from "../hooks/useAppContext";

export const getLevelIndex = (levelItems: LevelItem[], level: Level) =>
  levelItems.findIndex((item) => item.level === level);

/**
 * When `levelItems` is LineItems, the shipment level cannot be higher than product or warehouse.
 */
export const fixupLevelItems = ({
  shipmentsMode,
  levelItems,
  setLevelItems,
}: Pick<AppContext, "shipmentsMode" | "levelItems" | "setLevelItems">) => {
  if (shipmentsMode === ShipmentsMode.LineItems) {
    const baseIndex = Math.max(
      getLevelIndex(levelItems, "product"),
      getLevelIndex(levelItems, "warehouse")
    );
    const shipmentIndex = getLevelIndex(levelItems, "shipment");
    if (baseIndex > shipmentIndex) {
      const reordered = [...levelItems];
      const [shipmentItem] = reordered.splice(shipmentIndex, 1);
      reordered.splice(baseIndex, 0, shipmentItem);
      setLevelItems(reordered);
    }
  }
};

export const getLevelMeta = (
  levelItems: LevelItem[],
  level: number | Level,
  { shipmentsMode }: Pick<AppContext, "shipmentsMode">
) => {
  const i =
    typeof level === "number" ? level : getLevelIndex(levelItems, level);
  if (typeof level === "number") {
    level = levelItems[level].level;
  }

  const enabled = level !== "product";
  let upEnabled = i > 0;
  let downEnabled = i < levelItems.length - 1;
  switch (level) {
    case "product":
      downEnabled =
        downEnabled &&
        levelItems[i + 1].level !== "sizeGroup" &&
        (shipmentsMode === ShipmentsMode.BuildOrder ||
          levelItems[i + 1].level !== "shipment");
      break;
    case "warehouse":
      downEnabled =
        downEnabled &&
        (shipmentsMode === ShipmentsMode.BuildOrder ||
          levelItems[i + 1].level !== "shipment");
      break;
    case "sizeGroup":
      upEnabled = upEnabled && levelItems[i - 1].level !== "product";
      break;
    case "shipment":
      upEnabled =
        upEnabled &&
        (shipmentsMode === ShipmentsMode.BuildOrder ||
          (levelItems[i - 1].level !== "product" &&
            levelItems[i - 1].level !== "warehouse"));
      break;
  }

  return { enabled, upEnabled, downEnabled };
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
