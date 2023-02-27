import {
  EntityBucket,
  GridDataItem,
  Level,
  Product,
  Shipment,
  Size,
  Warehouse,
} from "./types";

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
