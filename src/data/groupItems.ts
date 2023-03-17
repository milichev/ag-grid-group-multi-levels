import _ from "lodash";
import {
  EntityBucket,
  GridDataItem,
  GridGroupDataItem,
  Level,
  LevelData,
  LevelIndices,
  Product,
  Shipment,
  SizeInfo,
  TotalInfo,
  Warehouse,
} from "./types";
import { measureStep, measureAction } from "../helpers/perf";
import { allLevels, emptySizeGroupId } from "../constants";
import { getItemEntities, getItemPropKey } from "./resolvers";
import { collectGroupTotals, collectProductTotals } from "./totals";

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

  const byIds: Map<string, GridDataItem[]> = measureAction(
    () => {
      switch (level) {
        case "sizeGroup":
          return product
            ? groupBySizeGroupWithinProduct(product, dataItems)
            : groupBySizeGroupOverProducts(dataItems, entities);
        default:
          return groupByEntity(level, levelIndex, visibleLevels, dataItems);
      }
    },
    { name: "groupItems:byIds", suppressResultOutput: true }
  );

  // GridGroupDataItem properties to be applied to items at this level
  const propLevels = allLevels.reduce((acc, l) => {
    if (
      visibleLevels[l] <= levelIndex ||
      (visibleLevels[l] === undefined && visibleLevels.product <= levelIndex)
    ) {
      acc.push(l);
    }
    return acc;
  }, [] as Level[]);

  const parentSizeGroup =
    parent && visibleLevels.sizeGroup < levelIndex
      ? parent.sizeGroup
      : undefined;
  const isLeafLevel = levelIndex === levels.length - 1;
  let items: GridGroupDataItem[] = [];

  measureAction(
    () => {
      byIds.forEach((group, id) => {
        const sizeGroup = level === "sizeGroup" ? id : parentSizeGroup;

        let sizeInfo: SizeInfo;
        let total: TotalInfo;
        if (isLeafLevel) {
          sizeInfo = getSizesBySizeGroup(group[0], sizeGroup);
          total = collectProductTotals(sizeInfo, group[0].product, sizeGroup);
        } else {
          total = collectGroupTotals(group, sizeGroup);
        }

        const gridItem: GridGroupDataItem = {
          id: level === "sizeGroup" && sizeGroup === "" ? emptySizeGroupId : id,
          level,
          group,
          parent,
          ...sizeInfo,
          total,
        };

        propLevels.forEach(
          (l) =>
            (gridItem[l] = l === "sizeGroup" ? sizeGroup : (group[0][l] as any))
        );

        items.push(gridItem);
      });
    },
    { name: "groupItems:map", suppressResultOutput: true }
  );

  items = measureAction(() => sortItems(items, level, propLevels), {
    name: "groupItems:sort",
    suppressResultOutput: true,
  });

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
    const { sizeGroup } = size;
    if (!byIds.has(sizeGroup)) {
      byIds.set(sizeGroup, dataItems);
    }
  });

  return byIds;
}

function groupBySizeGroupOverProducts(
  dataItems: GridDataItem[],
  entities: EntityBucket
) {
  const byIds = new Map<string, Set<GridDataItem>>();

  dataItems.forEach((item) => {
    item.product.sizes.forEach((size) => {
      const { sizeGroup } = size;
      let group = byIds.get(sizeGroup);
      if (!group) {
        group = new Set([item]);
        byIds.set(sizeGroup, group);
        getItemEntities(item, entities);
      } else if (!group.has(item)) {
        group.add(item);
        getItemEntities(item, entities);
      }
    });
  });

  return new Map([...byIds.entries()].map(([id, set]) => [id, [...set]]));
}

function groupByEntity(
  level: Level,
  levelIndex: number,
  visibleLevels: LevelIndices,
  dataItems: GridDataItem[]
) {
  const idLevels = allLevels.reduce((acc, l) => {
    if (
      l === level ||
      (visibleLevels[l] === undefined && level === "product")
    ) {
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
          if (
            sizeGroup === undefined ||
            sizeInfo.sizes[id].sizeGroup === sizeGroup
          ) {
            acc.sizes[id] = sizeInfo.sizes[id];
            acc.sizeIds.push(id);
          }
          return acc;
        },
        { sizes: {}, sizeIds: [] } as SizeInfo
      )
    : sizeInfo;
