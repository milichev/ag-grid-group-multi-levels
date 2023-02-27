import { Level, LevelItem, SelectableLevel, ShipmentsMode } from "./data/types";
import type { ContextValues } from "./hooks/useAppContext";
import { isLevel } from "./data/levels";

// reorder levels by default here
export const allLevels: readonly SelectableLevel[] = Object.freeze([
  "sizeGroup",
  "product",
  "warehouse",
  "shipment",
]);

export const defaultLevels: readonly LevelItem[] = Object.freeze(
  allLevels.map((level) => ({
    level,
    visible: isLevel(
      level,
      // uncomment to turn the level on by default
      "sizeGroup",
      "product",
      "warehouse",
      "shipment"
    ),
  }))
);

export const defaultCounts = {
  products: 2,
  warehouses: 2,
  buildOrderShipments: 5,
} as const;

export const defaultSettings: Omit<ContextValues, "levelItems"> = {
  isAllDeliveries: true,
  isUseSizeGroups: false,
  isLimitedSizes: false,
  isFlattenSizes: false,
  shipmentsMode: ShipmentsMode.BuildOrder,
};
