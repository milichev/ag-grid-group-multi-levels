import {
  type LevelItem,
  type SelectableLevel,
  ShipmentsMode,
} from "./data/types";
import type { SizeGridSettings } from "./components/size-grid/types";

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
    visible: [
      // uncomment to turn the level on by default
      "product",
      "shipment",
      // "warehouse",
      "sizeGroup",
    ].includes(level),
  }))
);

export const defaultCounts = {
  products: 50,
  warehouses: 2,
  buildOrderShipments: 5,
} as const;

export const defaultSettings: Omit<SizeGridSettings, "levelItems"> = {
  isAllDeliveries: false,
  isUseSizeGroups: false,
  isLimitedSizes: true,
  isFlattenSizes: false,
  shipmentsMode: ShipmentsMode.LineItems,
};

export const regularSizeNames = ["M"];
/** BTW, I saw somewhere clothes of size with more than 3X, like XXXXXL */
const X_SIZE_COUNT = 3;
for (let i = 0; i <= X_SIZE_COUNT; i++) {
  regularSizeNames.unshift(`${"X".repeat(i)}S`);
  regularSizeNames.push(`${"X".repeat(i)}L`);
}

export const emptySizeGroupId = "[EMPTY]";
