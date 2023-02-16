import {
  GridDataItem,
  Level,
  VisibleLevels,
  GridGroupDataItem,
  SizeQuantity,
  Product,
  GridGroupItem,
} from "../interfaces";
import { measureStep } from "./perf";
import { levels as allLevels } from "../constants";

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
  const step = measureStep({ name: "groupItems", async: false });

  const level = levels[levelIndex];
  const idLevels: Level[] = [];

  if (level !== "sizeGroup") {
    idLevels.push(level);
  }
  if (levelIndex === 0) {
    idLevels.push(...allLevels.filter((l) => l !== level && !visibleLevels[l]));
  }

  const getId = (item: GridDataItem) =>
    idLevels.map((l) => `${l}:${getItemPropKey(item, l)}`, []).join(";");
  const hasProduct = levels.indexOf("product") <= levelIndex;
  const product = hasProduct ? dataItems[0].product : undefined;
  const hasSizes = levelIndex >= levels.length - 1;
  const sizeGroupIdx = levels.indexOf("sizeGroup");
  const parentSizeGroup =
    parent && sizeGroupIdx >= 0 && sizeGroupIdx < levelIndex
      ? getParentSizeGroup(parent)
      : undefined;

  if (level === "shipment") {
    dataItems.sort((a, b) => +a.shipment.startDate - +b.shipment.endDate);
  }

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
    const sizeGroup = level === "sizeGroup" ? id : parentSizeGroup;
    let sizeInfo: SizeInfo;
    let ttlInfo: Pick<GridGroupItem, "ttlUnits" | "ttlCost">;
    if (hasSizes) {
      sizeInfo = getSizesBySizeGroup(group[0], sizeGroup);
      ttlInfo = collectSizesTotals(sizeInfo, product);
    } else {
      ttlInfo = collectGroupTotals(group);
    }
    const gridItem: GridGroupDataItem = {
      id,
      level,
      group,
      parent,
      product: product || undefined,
      sizeGroup,
      ...sizeInfo,
      ...ttlInfo,
    };
    idLevels.forEach((l) => (gridItem[l] = group[0][l]));
    gridItems.push(gridItem);
  });

  step.finish();

  return gridItems;
};

type SizeInfo = Pick<GridGroupDataItem, "sizes" | "sizeIds">;

const getSizesBySizeGroup = (sizeInfo: SizeInfo, sizeGroup: string): SizeInfo =>
  sizeGroup
    ? sizeInfo.sizeIds.reduce(
        (acc, id) => {
          if (sizeInfo.sizes[id].sizeGroup === sizeGroup) {
            acc.sizes[id] = sizeInfo.sizes[id];
            acc.sizeIds.push(id);
          }
          return acc;
        },
        { sizes: {}, sizeIds: [] } as SizeInfo
      )
    : sizeInfo;

export const collectGroupTotals = (group: GridDataItem[]) =>
  group.reduce(
    (acc, item) => {
      addSizesTotals(item, item.product, acc);
      return acc;
    },
    {
      ttlUnits: 0,
      ttlCost: 0,
    } as Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
  );

export const collectSizesTotals = (item: SizeInfo, product: Product) => {
  const acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost"> = {
    ttlUnits: 0,
    ttlCost: 0,
  };
  addSizesTotals(item, product, acc);
  return acc;
};

export const addSizesTotals = (
  sizeInfo: SizeInfo,
  product: Product,
  acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
) =>
  sizeInfo.sizeIds?.forEach((sizeId) => {
    const size = sizeInfo.sizes[sizeId];
    acc.ttlUnits += size.quantity;
    acc.ttlCost += product.wholesale * size.quantity;
  });
