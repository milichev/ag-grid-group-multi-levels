import { Level, LevelItem } from "./interfaces";
import { AppContext } from "./appContext";

export const getLevelIndex = (levelItems: LevelItem[], level: Level) =>
  levelItems.findIndex((item) => item.level === level);

export const fixupLevelItems = ({
  isBuildOrder,
  levelItems,
  setLevelItems,
}: Pick<AppContext, "isBuildOrder" | "levelItems" | "setLevelItems">) => {
  if (!isBuildOrder) {
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
  { isBuildOrder }: Pick<AppContext, "isBuildOrder">
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
        (isBuildOrder || levelItems[i + 1].level !== "shipment");
      break;
    case "warehouse":
      downEnabled =
        downEnabled && (isBuildOrder || levelItems[i + 1].level !== "shipment");
      break;
    case "sizeGroup":
      upEnabled = upEnabled && levelItems[i - 1].level !== "product";
      break;
    case "shipment":
      upEnabled =
        upEnabled &&
        (isBuildOrder ||
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
