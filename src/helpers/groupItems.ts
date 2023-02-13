import {
  GridDataItem,
  Level,
  levels as allLevels,
  VisibleLevels,
  GridGroupDataItem,
  SizeQuantity,
} from "../interfaces";
import { measureStep } from "./perf";

const getItemPropKey = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
    case "shipment":
      return item[level].id;
    // case "sizeGroup":
    //   return item[level];
    default:
      return "";
  }
};

const getGroupDispValue = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
      return item[level].name;
    case "shipment":
      return item.shipment.id;
    // case "sizeGroup":
    //   return item[level];
    default:
      return "";
  }
};

const getParentSizeGroup = (item: GridGroupDataItem | null) => {
  while (item) {
    if (item.sizeGroup) {
      return item.sizeGroup;
    }
    item = item.parent;
  }
};

export const groupItems = (
  dataItems: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  parent: GridGroupDataItem | null
): GridGroupDataItem[] => {
  const step = measureStep({ name: "GROUP_ITEMS", async: false });

  const level = levels[levelIndex];
  const idLevels: Level[] = [];

  if (level !== "sizeGroup") {
    idLevels.push(level);
  }
  if (levelIndex === 0) {
    idLevels.push(...allLevels.filter((l) => l !== level && !visibleLevels[l]));
  }

  const getId = (item: GridDataItem) =>
    idLevels.map((l) => getItemPropKey(item, l)).join(";");
  const hasProduct = levels.indexOf("product") <= levelIndex;
  const product = hasProduct ? dataItems[0].product : undefined;
  const hasSizes = levelIndex >= levels.length - 1;
  const sizeGroupIdx = levels.indexOf("sizeGroup");
  const parentSizeGroup =
    parent && sizeGroupIdx >= 0 && sizeGroupIdx < levelIndex
      ? getParentSizeGroup(parent)
      : undefined;

  const byIds = new Map<string, GridDataItem[]>();

  if (product && level === "sizeGroup") {
    product.sizes.forEach((size) => {
      if (size.sizeGroup && !byIds.has(size.sizeGroup)) {
        byIds.set(size.sizeGroup, dataItems);
      }
    });
  } else {
    dataItems.forEach((item) => {
      const id = getId(item);
      let group = byIds.get(id);
      if (!group) {
        group = [];
        byIds.set(id, group);
      }
      group.push(item);
    });
  }

  const gridItems: GridGroupDataItem[] = [];
  byIds.forEach((group, id) => {
    const gridItem: GridGroupDataItem = {
      id,
      level,
      group,
      parent,
      product: product || undefined,
      sizes: hasSizes ? group[0].sizes : undefined,
      sizeGroup: level === "sizeGroup" ? id : parentSizeGroup,
      ...(hasSizes ? collectSizesTotals(group[0]) : collectGroupTotals(group)),
    };
    idLevels.forEach((l) => (gridItem[l] = group[0][l]));
    gridItems.push(gridItem);
  });

  step.finish();

  return gridItems;
};

const collectGroupTotals = (group: GridDataItem[]) =>
  group.reduce(
    (acc, item) => {
      addSizesTotals(item, acc);
      return acc;
    },
    {
      ttlUnits: 0,
      ttlCost: 0,
    } as Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
  );

const collectSizesTotals = (item: GridDataItem) => {
  const acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost"> = {
    ttlUnits: 0,
    ttlCost: 0,
  };
  addSizesTotals(item, acc);
  return acc;
};

const addSizesTotals = (
  item: GridDataItem,
  acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
) =>
  item.sizeKeys.forEach((sizeId) => {
    const size = item.sizes[sizeId];
    acc.ttlUnits += size.quantity;
    acc.ttlCost += item.product.wholesale * size.quantity;
  });
