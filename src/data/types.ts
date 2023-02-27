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
  image: string;
  department: string;
  gender: string;
}

export interface Warehouse extends Entity {
  name: string;
  code: string;
  country: string;
  zip: string;
}

export interface Shipment extends Entity {
  startDate: Date;
  endDate: Date;
  isBuildOrder?: boolean;
}

export interface SizeQuantity extends Size {
  quantity: number;
}

export interface GridDataItem {
  id: string;
  product: Product;
  warehouse: Warehouse;
  shipment: Shipment;
  /** Here the quantities by sizes are placed */
  sizes: Record<string, SizeQuantity>;
  sizeIds: string[];
}

export type SizeInfo = Pick<GridDataItem, "sizes" | "sizeIds">;

export type Level =
  | keyof Pick<GridDataItem, "shipment" | "product" | "warehouse" | "sizes">
  | keyof Pick<Size, "sizeGroup">;

export type SelectableLevel = Extract<
  Level,
  "shipment" | "product" | "warehouse" | "sizeGroup"
>;

export interface LevelItem {
  level: Level;
  /** The sizing grid has the level enabled; otherwise the respective item attribute, such as warehouse or shipment, is represented as a column */
  visible: boolean;
}

/**
 * In the sizing grid representation, specifies how shipments are assigned to product items.
 */
export enum ShipmentsMode {
  /**
   * All items have the same shipments from the Build Order field, AND their individual shipments, if any.
   */
  BuildOrder = "BUILD_ORDER",
  /**
   * Each item has its own shipments.
   */
  LineItems = "LINE_ITEMS",
}

export type LevelIndices = Partial<Record<Level, number>>;

export interface TotalInfo {
  units: number;
  cost: number;
}

export interface GridGroupItem extends Partial<GridDataItem> {
  id: string;
  level: Level;
  group: GridDataItem[];
  sizeGroup?: string;
  parent: GridGroupDataItem | null;
  total: TotalInfo;
}

type GroupedLevelPropValues = {
  [prop in SelectableLevel as `${SelectableLevel}Prop`]?: string;
};

export type GridGroupDataItem = GridGroupItem & GroupedLevelPropValues;

export interface EntityBucket {
  itemIds?: Set<GridDataItem["id"]>;
  products?: Map<Product["id"], Product>;
  warehouses?: Map<Warehouse["id"], Warehouse>;
  shipments?: Map<Shipment["id"], Shipment>;
  sizeGroups?: Set<Size["sizeGroup"]>;
}

export interface LevelData {
  items: GridGroupDataItem[];
  entities: EntityBucket;
}
