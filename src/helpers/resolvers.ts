import { GridDataItem, Product, Warehouse, Shipment } from "../interfaces";

export const getDataItemId = (
  product: Product,
  warehouse: Warehouse,
  shipment: Shipment
) => `product:${product.id};warehouse:${warehouse.id};shipment:${shipment.id}`;

export const getSizeKey = (sizeName: string, sizeGroup: string) =>
  sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName;
