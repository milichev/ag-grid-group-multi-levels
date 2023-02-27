import _ from "lodash";
import {
  EntityBucket,
  GridDataItem,
  GridGroupDataItem,
  GridGroupItem,
  Level,
  LevelData,
  LevelIndices,
  Product,
  Shipment,
  SizeInfo,
  Warehouse,
} from "./types";
import { measureStep } from "../helpers/perf";
import { allLevels } from "../constants";
import { getItemEntities, getItemPropKey } from "./resolvers";
import { collectGroupTotals, collectSizesTotals } from "./totals";

export const groupItems = (
  dataItems: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: LevelIndices,
  parent: GridGroupDataItem | null
): LevelData => {
  const step = measureStep({ name: "groupItems", async: false });

  const level = levels[levelIndex];

  const entities: EntityBucket = {
    itemIds: new Set<GridDataItem["id"]>(),
    products: new Map<Warehouse["id"], Product>(),
    warehouses: new Map<Shipment["id"], Warehouse>(),
    shipments: new Map<Product["id"], Shipment>(),
  };

  const product =
    visibleLevels.product < levelIndex ? dataItems[0].product : undefined;
  product && entities.products.set(product.id, product);

  let byIds: Map<string, GridDataItem[]>;
  switch (level) {
    case "sizeGroup":
      byIds = product
        ? groupBySizeGroupWithinProduct(product, dataItems)
        : groupBySizeGroupOverProducts(dataItems, entities);
      break;
    default:
      byIds = groupByEntity(level, levelIndex, visibleLevels, dataItems);
      break;
  }

  // GridGroupDataItem properties to be applied to items at this level
  const propLevels = allLevels.reduce((acc, l) => {
    if (visibleLevels[l] <= levelIndex || visibleLevels[l] === undefined) {
      acc.push(l);
    }
    return acc;
  }, [] as Level[]);

  const parentSizeGroup =
    parent && visibleLevels.sizeGroup < levelIndex
      ? parent.sizeGroup
      : undefined;

  let items: GridGroupDataItem[] = [];
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

    items.push(gridItem);
  });

  const sortStep = measureStep({ name: "groupSort", async: false });
  items = sortItems(items, level, propLevels);
  sortStep.finish();

  step.finish();

  return {
    items,
    entities,
  };
};

function sortItems(
  items: GridGroupDataItem[],
  level: Level,
  propLevels: Level[]
) {
  const sortLevels = [level].concat(propLevels.filter((l) => l !== level));
  const sortProps = _.flatten(
    sortLevels.map((level) => {
      switch (level) {
        case "product":
        case "warehouse":
          return `${level}.name`;
        case "shipment":
          return ["shipment.startDate", "shipment.endDate"];
        case "sizeGroup":
          return level;
        default:
          return undefined;
      }
    })
  );

  return _.sortBy(items, sortProps) as typeof items;
}

function groupBySizeGroupWithinProduct(
  product: Product,
  dataItems: GridDataItem[]
) {
  const byIds = new Map<string, GridDataItem[]>();

  product.sizes.forEach((size) => {
    if (size.sizeGroup && !byIds.has(size.sizeGroup)) {
      byIds.set(size.sizeGroup, dataItems);
    }
  });

  return byIds;
}

function groupBySizeGroupOverProducts(
  dataItems: GridDataItem[],
  entities: EntityBucket
) {
  const byIds = new Map<string, GridDataItem[]>();

  dataItems.forEach((item) => {
    item.product.sizes.forEach((size) => {
      const { sizeGroup } = size;
      let group = byIds.get(sizeGroup);
      if (!group) {
        group = [item];
        byIds.set(sizeGroup, group);
      } else {
        group.push(item);
      }
      getItemEntities(item, entities);
    });
  });

  return byIds;
}

function groupByEntity(
  level: Level,
  levelIndex: number,
  visibleLevels: LevelIndices,
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
      group = [item];
      byIds.set(id, group);
    } else {
      group.push(item);
    }
  });

  return byIds;
}

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
