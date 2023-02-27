import { Level, LevelItem, SelectableLevel, ShipmentsMode } from "./data/types";
import type { ContextValues } from "./hooks/useAppContext";
import { isLevel } from "./data/levels";

// reorder levels by default here
export const allLevels: readonly SelectableLevel[] = Object.freeze([
  "product",
  "shipment",
  "warehouse",
  "sizeGroup",
]);

export const defaultLevels: readonly LevelItem[] = Object.freeze(
  allLevels.map((level) => ({
    level,
    visible: isLevel(
      level,
      // uncomment to turn the level on by default
      "product",
      "shipment",
      // "warehouse",
      "sizeGroup"
    ),
  }))
);

export const defaultCounts = {
  products: 50,
  warehouses: 2,
  buildOrderShipments: 5,
} as const;

export const defaultSettings: Omit<ContextValues, "levelItems"> = {
  isAllDeliveries: true,
  isUseSizeGroups: true,
  isLimitedSizes: true,
  isFlattenSizes: false,
  shipmentsMode: ShipmentsMode.BuildOrder,
};

export const regularSizeNames = ["S", "M", "L"];
const xSizeCount = 3;
for (let i = 1; i <= xSizeCount; i++) {
  regularSizeNames.unshift(`${"X".repeat(i)}S`);
  regularSizeNames.push(`${"X".repeat(i)}L`);
}

export const emptySizeGroupId = "[EMPTY]";
