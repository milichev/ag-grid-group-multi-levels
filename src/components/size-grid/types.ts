import { GridGroupDataItem, Level } from "../../data/types";
import {
  ColDef,
  ColumnApi,
  GridApi,
  ICellRendererParams,
} from "ag-grid-community";
import { AppContext } from "../../hooks/useAppContext";
import { AgGridReactProps } from "ag-grid-react";
import {
  IAggFunc,
  ValueFormatterFunc,
} from "ag-grid-community/dist/lib/entities/colDef";
import { IDetailCellRendererParams } from "ag-grid-community/dist/lib/interfaces/masterDetail";

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  appContext: AppContext;
  master: null | {
    id: string;
    api: GridApi<GridGroupDataItem>;
    columnApi: ColumnApi;
    context: GridContext;
  };
}

export type SizeGridProps = AgGridReactProps<GridGroupDataItem>;
export type SizeGridColDef = ColDef<GridGroupDataItem>;
export type SizeGridAggFunc<TValue = any> = IAggFunc<GridGroupDataItem, TValue>;
export type SizeGridValueFormatterFunc = ValueFormatterFunc<GridGroupDataItem>;
export type SizeGridGetDetailCellRendererParams = (
  params: Omit<ICellRendererParams<GridGroupDataItem>, "value">
) => Partial<IDetailCellRendererParams<GridGroupDataItem, GridGroupDataItem>>;
