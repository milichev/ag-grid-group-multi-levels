export interface Entity {
  id: string;
}

export interface Size extends Entity {
  name: string;
  sizeGroup?: string;
}

export interface Product extends Entity {
  name: string;
  retail: number;
  wholesale: number;
  color: string;
  sizes: Size[];
}

export interface Warehouse extends Entity {
  name: string;
  zip: string;
}

export interface Shipment extends Entity {
  startDate: Date;
  endDate: Date;
}

/**
 * Represends a product size with quantity
 */
export interface GridSize extends Size {
  quantity: number;
}

export interface GridDataItem {
  product: Product;
  warehouse: Warehouse;
  shipment: Shipment;
  /** Here the quantities are placed */
  sizes: Record<string, GridSize>;
  sizeIds: string[];
}

export type Level =
  | keyof Pick<GridDataItem, "shipment" | "product" | "warehouse" | "sizes">
  | keyof Pick<Size, "sizeGroup">;

export type SelectableLevel = Extract<
  Level,
  "shipment" | "product" | "warehouse" | "sizeGroup"
>;

export interface NestLevelItem {
  level: Level;
  visible: boolean;
}

export const levels: SelectableLevel[] = [
  "product",
  "warehouse",
  "shipment",
  "sizeGroup",
];

export type VisibleLevels = Partial<Record<Level, true>>;

export interface GridGroupItem extends Partial<GridDataItem> {
  id: string;
  level: Level;
  group: GridDataItem[];
  sizeGroup?: string;
  parent: GridGroupDataItem | null;
  ttlUnits?: number;
  ttlCost?: number;
}

export type GroupedLevelProp = `${SelectableLevel}Prop`;
type GroupedLevelPropValues = {
  [prop in GroupedLevelProp]?: string;
};

export type GridGroupDataItem = GridGroupItem & GroupedLevelPropValues;
