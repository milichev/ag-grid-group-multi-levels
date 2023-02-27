import fp from "lodash/fp";
import _ from "lodash";
import {
  EntityBucket,
  GridDataItem,
  Level,
  Product,
  Shipment,
  Size,
  Warehouse,
} from "./types";
import { regularSizeNames } from "../constants";
import * as stream from "stream";

export const getDataItemId = (
  product: Product,
  warehouse: Warehouse,
  shipment: Shipment
): GridDataItem["id"] =>
  `product:${product.id};warehouse:${warehouse.id};shipment:${shipment.id}`;

export const getItemPropKey = (item: GridDataItem, level: Level): string => {
  switch (level) {
    case "product":
    case "warehouse":
    case "shipment":
      return item[level].id;
    default:
      return "";
  }
};

export const getSizeKey = (sizeName: string, sizeGroup: string) =>
  sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName;

export const collectEntities = (
  items: GridDataItem[],
  entities: EntityBucket = {
    itemIds: new Set<GridDataItem["id"]>(),
    products: new Map<Warehouse["id"], Product>(),
    warehouses: new Map<Shipment["id"], Warehouse>(),
    shipments: new Map<Product["id"], Shipment>(),
    sizeGroups: new Set<Size["sizeGroup"]>(),
  }
) => {
  items.forEach((item) => {
    getItemEntities(item, entities);
  });

  return entities;
};

export const getItemEntities = (item: GridDataItem, entities: EntityBucket) => {
  entities.itemIds?.add(item.id);

  if (entities.products && !entities.products.has(item.product.id)) {
    entities.products.set(item.product.id, item.product);
  }
  if (entities.warehouses && !entities.warehouses.has(item.warehouse.id)) {
    entities.warehouses.set(item.warehouse.id, item.warehouse);
  }
  if (entities.shipments && !entities.shipments.has(item.shipment.id)) {
    entities.shipments.set(item.shipment.id, item.shipment);
  }
  if (entities.sizeGroups) {
    item.product.sizes.forEach((size) => {
      if (!entities.sizeGroups.has(size.sizeGroup)) {
        entities.sizeGroups.add(size.sizeGroup);
      }
    });
  }
};

type SizeSortRec = [string, number];
const numSizeRe = /^\d+(?:\.\d+)?$/;
const sizeSeparator = ", ";

const trySortNumberSizes = (names: string[]): SizeSortRec[] => {
  const numbers = Array<SizeSortRec>(names.length);
  for (let i = 0; i < names.length; i++) {
    if (!numSizeRe.test(names[i])) {
      return undefined;
    }
    numbers[i] = [names[i], +names[i]];
  }
  return _.sortBy(numbers, (rec) => rec[1]);
};

const tryGroupNumberSizes = (names: string[]) => {
  const sorted = trySortNumberSizes(names);
  if (!sorted) {
    return undefined;
  }

  let minStep: number;
  sorted.forEach(([name, val], i, arr) => {
    if (i > 0) {
      const step = val - arr[i - 1][1];
      if (i === 1 || step < minStep) {
        minStep = step;
      }
    }
  });

  return formatSortedSizes(sorted, minStep, sizeSeparator);
};

const formatSortedSizes = (
  sorted: SizeSortRec[],
  step: number,
  separator = ", "
) =>
  sorted
    .reduce((ranges, rec) => {
      let tail: SizeSortRec[];
      if (
        ranges.length > 0 &&
        rec[1] - (tail = ranges.at(-1)).at(-1)[1] === step
      ) {
        if (tail.length === 1) {
          tail.push(rec);
        } else {
          tail[1] = rec;
        }
      } else {
        ranges.push([rec]);
      }
      return ranges;
    }, [] as SizeSortRec[][])
    .map((pair) => {
      return pair.length === 1
        ? pair[0][0]
        : `${pair[0][0]}${pair[1][1] - pair[0][1] === step ? separator : "-"}${
            pair[1][0]
          }`;
    })
    .join(separator);

const regularSizeIndices = regularSizeNames.reduce((acc, size, i) => {
  acc[size] = i;
  return acc;
}, {} as Record<string, number>);

const trySortRegularSizes = (names: string[]): SizeSortRec[] => {
  const numbers = Array<SizeSortRec>(names.length);
  for (let i = 0; i < names.length; i++) {
    const regularIndex = regularSizeIndices[names[i].toUpperCase()];
    if (regularIndex === undefined) {
      return undefined;
    }
    numbers[i] = [names[i], regularIndex];
  }
  return _.sortBy(numbers, (rec) => rec[1]);
};

const tryGroupRegularSizes = (names: string[]) => {
  const sorted = trySortRegularSizes(names);
  return sorted ? formatSortedSizes(sorted, 1, sizeSeparator) : undefined;
};

export const sortSizeNames = (names: string[]): string[] => {
  const sorted = trySortRegularSizes(names) ?? trySortNumberSizes(names);
  return sorted?.map((rec) => rec[0]) ?? names;
};

const groupSizeNames = (names: string[]) =>
  tryGroupNumberSizes(names) ??
  tryGroupRegularSizes(names) ??
  names.join(sizeSeparator);

export const formatSizes: (p: Product) => string = fp.pipe([
  fp.prop("sizes"),
  fp.map("name"),
  fp.sortBy(fp.identity),
  fp.uniq,
  groupSizeNames,
]);
