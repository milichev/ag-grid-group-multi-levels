import { AgGridReactProps } from "ag-grid-react";
import {
  ColDef,
  ColumnApi,
  GridApi,
  GroupCellRendererParams,
  IAggFunc,
  // RowNode,
  IRowNode,
  ValueFormatterFunc,
  ICellRendererParams,
  IDetailCellRendererParams,
} from "ag-grid-community";
import {
  GridGroupDataItem,
  Level,
  LevelItem,
  ShipmentsMode,
} from "../../data/types";
import type { SizeGridContext } from "../../hooks/useSizeGridContext";

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  sizeGridContext: SizeGridContext;
  master: null | {
    id: string;
    api: SizeGridApi;
    columnApi: ColumnApi;
    context: GridContext;
  };
}

type WithSizeGridContext<T> = T extends { context: any }
  ? CastProp<T, "context", GridContext>
  : T;
type WithSizeGridData<T> = T extends { data: infer D }
  ? GridGroupDataItem extends D
    ? CastProp<T, "data", GridGroupDataItem>
    : T
  : T;
type WithSizeGridRowNode<T> = T extends { node: IRowNode }
  ? CastProp<T, "node", SizeGridRowNode>
  : T;

export type WithSizeGridEntities<T> = WithSizeGridContext<
  WithSizeGridData<WithSizeGridRowNode<T>>
>;

type SizeGridContextHandler<H extends (params: any) => any> = H extends (
  params: infer P
) => infer R
  ? P extends { context: any }
    ? (params: WithSizeGridContext<P>) => R
    : H
  : H;
type SizeGridDataHandler<H extends (params: any) => any> = H extends (
  params: infer P
) => infer R
  ? P extends { data: any }
    ? (params: WithSizeGridData<P>) => R
    : H
  : H;
type SizeGridNodeHandler<H extends (params: any) => any> = H extends (
  params: infer P
) => infer R
  ? P extends { node: IRowNode }
    ? (params: WithSizeGridRowNode<P>) => R
    : H
  : H;

type SizeGridHandler<H extends (params: any) => any> = SizeGridContextHandler<
  SizeGridDataHandler<SizeGridNodeHandler<H>>
>;

export type AllSizeGridHandlers<T extends object> = {
  [K in keyof T]: T[K] extends (params: any) => any
    ? SizeGridHandler<T[K]>
    : T[K];
};

export type SizeGridEventHandler<K extends keyof SizeGridProps> =
  SizeGridProps[K];

export type SizeGridProps = AllSizeGridHandlers<
  CastProp<AgGridReactProps<GridGroupDataItem>, "context", GridContext>
>;
export type SizeGridApi = GridApi<GridGroupDataItem>;
export type SizeGridColDef = AllSizeGridHandlers<ColDef<GridGroupDataItem>>;
export type SizeGridRowNode = IRowNode<GridGroupDataItem>;
export type SizeGridAggFunc<TValue = any> = SizeGridHandler<
  IAggFunc<GridGroupDataItem, TValue>
>;
export type SizeGridValueFormatterFunc = ValueFormatterFunc<GridGroupDataItem>;
export type SizeGridGroupCellRendererParams = WithSizeGridEntities<
  GroupCellRendererParams<GridGroupDataItem>
>;
export type SizeGridCellRendererParams = ICellRendererParams<GridGroupDataItem>;
export type SizeGridCellRendererOptions = Omit<
  SizeGridCellRendererParams,
  | "value"
  | "valueFormatted"
  | "data"
  | "node"
  | "api"
  | "columnApi"
  | "context"
  | "rowIndex"
  | "eGridCell"
  | "eParentOfValue"
  | "registerRowDragger"
>;

export type SizeGridGetDetailCellRendererParams = (
  params: WithSizeGridContext<Omit<SizeGridCellRendererParams, "value">>
) => Partial<IDetailCellRendererParams<GridGroupDataItem, GridGroupDataItem>>;

export interface SizeGridSettings {
  levelItems: LevelItem[];
  shipmentsMode: ShipmentsMode;
  isAllDeliveries: boolean;
  isFlattenSizes: boolean;
  isLimitedSizes: boolean;
  isUseSizeGroups: boolean;
}
