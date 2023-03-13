import {
  GridGroupDataItem,
  Level,
  LevelItem,
  ShipmentsMode,
} from "../../data/types";
import {
  ColDef,
  ColumnApi,
  GridApi,
  ICellRendererParams,
} from "ag-grid-community";
import type { SizeGridContext } from "../../hooks/useSizeGridContext";
import { AgGridReactProps } from "ag-grid-react";
import {
  IAggFunc,
  ValueFormatterFunc,
} from "ag-grid-community/dist/lib/entities/colDef";
import { IDetailCellRendererParams } from "ag-grid-community/dist/lib/interfaces/masterDetail";

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  sizeGridContext: SizeGridContext;
  master: null | {
    id: string;
    api: GridApi<GridGroupDataItem>;
    columnApi: ColumnApi;
    context: GridContext;
  };
}

type AnyContextOwner = { context: any };

type WithSizeGridContext<T extends AnyContextOwner> = CastProp<
  T,
  "context",
  GridContext
>;

type SizeGridHandler<H extends (params: AnyContextOwner) => any> = H extends (
  params: infer P
) => infer R
  ? P extends AnyContextOwner
    ? (params: WithSizeGridContext<P>) => R
    : H
  : H;

type AllSizeGridHandlers<T extends object> = {
  [K in keyof T]: T[K] extends (params: AnyContextOwner) => any
    ? SizeGridHandler<T[K]>
    : T[K];
};

export type SizeGridEventHandler<K extends keyof SizeGridProps> =
  SizeGridProps[K];

export type SizeGridProps = AllSizeGridHandlers<
  CastProp<AgGridReactProps<GridGroupDataItem>, "context", GridContext>
>;
export type SizeGridColDef = AllSizeGridHandlers<ColDef<GridGroupDataItem>>;
export type SizeGridAggFunc<TValue = any> = SizeGridHandler<
  IAggFunc<GridGroupDataItem, TValue>
>;
export type SizeGridValueFormatterFunc = ValueFormatterFunc<GridGroupDataItem>;
export type SizeGridGetDetailCellRendererParams = (
  params: WithSizeGridContext<
    Omit<ICellRendererParams<GridGroupDataItem>, "value">
  >
) => Partial<IDetailCellRendererParams<GridGroupDataItem, GridGroupDataItem>>;

export interface SizeGridSettings {
  levelItems: LevelItem[];
  shipmentsMode: ShipmentsMode;
  isAllDeliveries: boolean;
  isFlattenSizes: boolean;
  isLimitedSizes: boolean;
  isUseSizeGroups: boolean;
}
