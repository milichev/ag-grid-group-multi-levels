import _ from "lodash";
import {
  GridDataItem,
  GridGroupDataItem,
  GridGroupItem,
  Level,
  Product,
  VisibleLevels,
} from "../types";
import { measureStep } from "./perf";
import { levels as allLevels } from "../constants";
import { isLevel } from "./levels";

const getItemPropKey = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
    case "shipment":
      return item[level].id;
    default:
      return "";
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

  // GridGroupDataItem properties to be applied to items at this level
  const propLevels = allLevels.reduce((acc, l) => {
    if (visibleLevels[l] <= levelIndex || visibleLevels[l] === undefined) {
      acc.push(l);
    }
    return acc;
  }, [] as Level[]);

  const product =
    visibleLevels.product <= levelIndex ? dataItems[0].product : undefined;
  const parentSizeGroup =
    parent && visibleLevels.sizeGroup < levelIndex
      ? parent.sizeGroup
      : undefined;

  const byIds: Map<string, GridDataItem[]> =
    product && level === "sizeGroup"
      ? groupBySizeGroup(product, dataItems)
      : groupByEntity(level, levelIndex, visibleLevels, dataItems);

  let gridItems: GridGroupDataItem[] = [];

  byIds.forEach((group, id) => {
    const sizeGroup = level === "sizeGroup" ? id : parentSizeGroup;
    let sizeInfo: SizeInfo;
    let ttlInfo: Pick<GridGroupItem, "ttlUnits" | "ttlCost">;
    if (levelIndex === levels.length - 1) {
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
      ...sizeInfo,
      ...ttlInfo,
    };
    propLevels.forEach(
      (l) =>
        (gridItem[l] = l === "sizeGroup" ? sizeGroup : (group[0][l] as any))
    );
    gridItems.push(gridItem);
  });

  const sortStep = measureStep({ name: "groupSort", async: false });

  // TODO: seems that the property list based lodash sorting is a way faster, but let's leave our own one to check later.
  // const sortLevels = [level, ...propLevels.filter((l) => l !== level)];
  // gridItems.sort(getItemComparer(sortLevels));

  const sortProps = _.flatten(
    [level]
      .concat(propLevels.filter((l) => l !== level))
      .map((l) =>
        isLevel(l, "product", "warehouse")
          ? `${l}.name`
          : l === "shipment"
          ? ["shipment.startDate", "shipment.endDate"]
          : l === "sizeGroup"
          ? l
          : undefined
      )
  );
  gridItems = _.sortBy(gridItems, sortProps) as typeof gridItems;
  sortStep.finish();

  step.finish();

  return gridItems;
};

/*
const getItemComparer =
  (levels: Level[]) =>
  (a: GridGroupDataItem, b: GridGroupDataItem): number => {
    let result = 0;
    for (let i = 0; i < levels.length && result === 0; i++) {
      const level = levels[i];
      switch (level) {
        case "product":
        case "warehouse":
          result = a[level].name.localeCompare(b[level].name, undefined, {
            ignorePunctuation: true,
          });
          break;
        case "shipment":
          result = +a.shipment.startDate - +b.shipment.startDate;
          if (result === 0) {
            result = +a.shipment.endDate - +b.shipment.endDate;
          }
          break;
      }
    }
    return result;
s  };
*/

function groupBySizeGroup(product: Product, dataItems: GridDataItem[]) {
  const byIds = new Map<string, GridDataItem[]>();

  product.sizes.forEach((size) => {
    if (size.sizeGroup && !byIds.has(size.sizeGroup)) {
      byIds.set(size.sizeGroup, dataItems);
    }
  });

  return byIds;
}

function groupByEntity(
  level: Level,
  levelIndex: number,
  visibleLevels: VisibleLevels,
  dataItems: GridDataItem[]
) {
  const idLevels = allLevels.reduce((acc, l) => {
    if (l === level || (levelIndex === 0 && visibleLevels[l] === undefined)) {
      acc.push(l);
    }
    return acc;
  }, [] as Level[]);

  const getId = (item: GridDataItem) =>
    idLevels.map((l) => `${l}:${getItemPropKey(item, l)}`, []).join(";");

  const byIds = new Map<string, GridDataItem[]>();

  dataItems.forEach((item) => {
    const id = getId(item);
    let group = byIds.get(id);
    if (!group) {
      group = [];
      byIds.set(id, group);
    }
    group.push(item);
  });

  return byIds;
}

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
