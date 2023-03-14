import { SizeGridProps } from "../types";
import { defaultColDef } from "./getColumnDefs";
import { columnTypes } from "./columnTypes";

export const commonGridProps = {
  defaultColDef,
  columnTypes,
  animateRows: true,
  suppressAutoSize: false,
  detailRowAutoHeight: true,
  // groupIncludeFooter: true,
  // groupIncludeTotalFooter: true,
  singleClickEdit: true,
  stopEditingWhenCellsLoseFocus: true,
  undoRedoCellEditing: true,
  // enableCellEditingOnBackspace: true, // TODO: ag-grid@29
  allowContextMenuWithControlKey: true,
  suppressAggFuncInHeader: true,
  enableCellChangeFlash: true,
  suppressReactUi: false,
  // TODO: ag-grid version v29.0.0 often crashes in addStickyRow method.
  // groupRowsSticky: true,
  getRowId: (params) => params.data.id,
  getRowClass: (params) => (params.node.group ? "" : "ag-row-leaf"),
} satisfies Partial<SizeGridProps>;
