import { AgGridReactProps } from "ag-grid-react";
import {
  ColDef,
  ColumnApi,
  GridApi,
  GroupCellRendererParams,
  IAggFunc,
  ICellRendererParams,
  IRichCellEditorParams,
  IRowNode,
  ValueFormatterFunc,
} from "ag-grid-community";
import {
  GridGroupDataItem,
  Level,
  LevelItem,
  ShipmentsMode,
  SizeGridData,
} from "../../data/types";
import { Dispatch } from "react";

export interface SizeGridSettings {
  levelItems: LevelItem[];
  shipmentsMode: ShipmentsMode;
  isAllDeliveries: boolean;
  isFlattenSizes: boolean;
  isLimitedSizes: boolean;
  isUseSizeGroups: boolean;
}

type PropAction<T, K extends keyof T> = {
  prop: K;
  payload: T[K];
};

export type SizeGridContextAction = PropAction<
  SizeGridSettings,
  keyof SizeGridSettings
>;

/**
 * Ambient context available through the component tree
 */
export interface SizeGridContext extends SizeGridSettings {
  getPopupParent(): HTMLElement;
  setPopupParent(element: HTMLElement);
  dispatch: Dispatch<SizeGridContextAction>;
}

/**
 * Context which is set to `SizeGridProps.context`. Each level grid has its level context.
 */
export interface SizeGridLevelContext {
  levels: Level[];
  levelIndex: number;
  getData: () => SizeGridData;
  sizeGridContext: SizeGridContext;
  master: null | {
    id: string;
    api: SizeGridApi;
    columnApi: ColumnApi;
    context: SizeGridLevelContext;
  };
}

type WithSizeGridContext<T> = T extends { context: any }
  ? CastProp<T, "context", SizeGridLevelContext>
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
  CastProp<AgGridReactProps<GridGroupDataItem>, "context", SizeGridLevelContext>
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
type OmitCellRendererParamsForOptions = keyof Pick<
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
export type SizeGridCellRendererOptions = Omit<
  SizeGridCellRendererParams,
  OmitCellRendererParamsForOptions
>;

export type SizeGridRichCellEditorParams = IRichCellEditorParams;
export type OmitCellEditorParamsForOptions = keyof Pick<
  IRichCellEditorParams,
  | "api"
  | "columnApi"
  | "context"
  | "rowIndex"
  | "eGridCell"
  | "value"
  | "eventKey"
  | "charPress"
  | "column"
  | "colDef"
  | "node"
  | "data"
  | "cellStartedEdit"
  | "onKeyDown"
  | "stopEditing"
>;
