import { Level, SelectableLevel, ShipmentsMode } from "./types";
import type { ContextValues } from "./hooks/useAppContext";

export const allLevels: SelectableLevel[] = [
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
} as const;

export const defaultSettings: Omit<ContextValues, "levelItems"> = {
  isAllDeliveries: true,
  isUseSizeGroups: true,
  isLimitedSizes: false,
  isFlattenSizes: false,
  shipmentsMode: ShipmentsMode.BuildOrder,
};
