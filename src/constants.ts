import { Level, SelectableLevel, ShipmentsMode } from "./interfaces";

export const levels: SelectableLevel[] = [
  "product",
  "warehouse",
  "shipment",
  "sizeGroup",
];

export const defaultLevels: Level[] = [
  "product",
  "shipment",
  // "warehouse",
  "sizeGroup",
];

export const defaultCounts = {
  products: 20,
  warehouses: 5,
  buildOrderShipments: 5,
  sizeGroups: 3,
};

export const defaultShipmentsMode = ShipmentsMode.LineItems;

export const defaultIsAllDeliveries = false;
