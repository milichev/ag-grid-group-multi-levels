import {
  GridDataItem,
  Product,
  Warehouse,
  Shipment,
  Level,
  levels as allLevels,
  VisibleLevels,
  GridGroupDataItem,
} from "./interfaces";
import { measureStep } from "./perf";

const getItemPropKey = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
    case "shipment":
      return item[level].id;
    case "sizeGroup":
      return item[level];
  }
};

const getGroupDispValue = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
      return item[level].name;
    case "shipment":
      return item.shipment.id;
    case "sizeGroup":
      return item[level];
  }
};

const getParentSizeGroup = (item: GridGroupDataItem) => {
  while (item) {
    if (item.sizeGroup) return item.sizeGroup;
    item = item.parent;
  }
};

export const groupItems = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  parent: GridGroupDataItem | null
): GridGroupDataItem[] => {
  const step = measureStep({ name: "GROUP_ITEMS", async: false });

  const level = levels[levelIndex];
  const levelIds: string[] = [];
  const idLevels: Level[] = [];

  level !== "sizeGroup" && idLevels.push(level);
  if (levelIndex === 0) {
    idLevels.push(...allLevels.filter((l) => l !== level && !visibleLevels[l]));
  }

  const getId = (item: GridDataItem) =>
    idLevels.map((l) => getItemPropKey(item, l)).join(";");
  const hasProduct = levels.indexOf("product") <= levelIndex;
  const product = hasProduct && gridData[0].product;
  const hasSizes = levelIndex >= levels.length - 1;
  const sizeGroupIdx = levels.indexOf("sizeGroup");
  const parentSizeGroup =
    parent && sizeGroupIdx >= 0 && sizeGroupIdx < levelIndex
      ? getParentSizeGroup(parent)
      : undefined;

  const byIds = new Map<string, GridDataItem[]>();
  if (level === "sizeGroup") {
    product.sizes.forEach((size) => {
      if (!byIds.has(size.sizeGroup)) {
        byIds.set(size.sizeGroup, gridData);
        levelIds.push(size.sizeGroup);
      }
    });
  } else {
    gridData.forEach((item) => {
      const id = getId(item);
      let group = byIds.get(id);
      if (!group) {
        group = [];
        byIds.set(id, group);
        levelIds.push(id);
      }
      group.push(item);
    });
  }

  const items = levelIds.reduce((acc, id) => {
    const group = byIds.get(id);
    const groupItem: GridGroupDataItem = {
      id,
      level,
      group,
      parent,
      product: product || undefined,
      sizes: hasSizes ? group[0].sizes : undefined,
      sizeGroup: level === "sizeGroup" ? id : parentSizeGroup,
    };
    idLevels.forEach((l) => (groupItem[l] = group[0][l]));
    acc.push(groupItem);
    return acc;
  }, [] as GridGroupDataItem[]);

  step.finish();

  return items;
};
