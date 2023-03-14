import { SizeGridProps } from "../types";
import { defaultColDef } from "./getColumnDefs";
import { columnTypes } from "./columnTypes";
import { getContextMenuItems } from "./getContextMenuItems";
import { getMainMenuItems } from "./getMainMenuItems";
import { onColumnRowGroupChanged } from "./onColumnRowGroupChanged";
import { postProcessPopup } from "./postProcessPopup";
import { onRowDataUpdated } from "./onRowDataUpdated";
import { onCellValueChanged } from "./onCellValueChanged";

export const commonGridProps: Partial<SizeGridProps> = {
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
  enableCellEditingOnBackspace: true,
  allowContextMenuWithControlKey: true,
  suppressAggFuncInHeader: true,
  enableCellChangeFlash: true,
  suppressReactUi: false,
  // TODO: ag-grid version v29.0.0 often crashes in addStickyRow method.
  // groupRowsSticky: true,
  getRowId: (params) => params.data.id,
  onRowGroupOpened: (params) => {
    console.log("onRowGroupOpened", params);
  },
  getRowClass: (params) => (params.node.group ? "" : "ag-row-leaf"),
  getContextMenuItems,
  getMainMenuItems,
  onColumnRowGroupChanged,
  postProcessPopup,
  onRowDataUpdated,
  onCellValueChanged,
  onCellEditingStarted: (params) => {
    if (params.colDef.type === "quantityColumn" && params.value === undefined) {
      params.api.stopEditing(true);
    }
  },
};
