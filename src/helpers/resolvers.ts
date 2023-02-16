import {
  GridDataItem,
  Product,
  Warehouse,
  Shipment,
  ShipmentsMode,
} from "../types";

export const getDataItemId = (
  product: Product,
  warehouse: Warehouse,
  shipment: Shipment
) => `product:${product.id};warehouse:${warehouse.id};shipment:${shipment.id}`;

export const getSizeKey = (sizeName: string, sizeGroup: string) =>
  sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName;

export const collectEntities = (
  items: GridDataItem[],
  { ids = false, products = false, warehouses = false, shipments = false } = {}
) => {
  const allProducts = new Map<string, Product>();
  const allWarehouses = new Map<string, Warehouse>();
  const allShipments = new Map<string, Shipment>();
  const itemIds = new Set<GridDataItem["id"]>();

  items.forEach((item) => {
    itemIds.add(item.id);

    if (!allProducts.has(item.product.id)) {
      allProducts.set(item.product.id, item.product);
    }
    if (!allWarehouses.has(item.warehouse.id)) {
      allWarehouses.set(item.warehouse.id, item.warehouse);
    }
    if (!allShipments.has(item.shipment.id)) {
      allShipments.set(item.shipment.id, item.shipment);
    }
  });

  return {
    itemIds,
    products: allProducts,
    warehouses: allWarehouses,
    shipments: allShipments,
  };
};
