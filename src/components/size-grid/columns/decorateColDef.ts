import classname from "classname";
import {
  OmitCellEditorParamsForOptions,
  SizeGridColDef,
  SizeGridContext,
} from "../types";
import {
  Level,
  LevelIndices,
  SizeGridData,
  Warehouse,
} from "../../../data/types";
import { IRichCellEditorParams } from "ag-grid-community";
import { RichSelectCellRenderer } from "../components";

export const decorateColDef = ({
  col,
  colRole,
  data,
}: {
  col: SizeGridColDef;
  colRole: "levelGroup" | "rowGroup" | "nonGroup";
  levels: Level[];
  levelIndex: number;
  levelIndices: LevelIndices;
  data: SizeGridData;
  sizeGridContext: SizeGridContext;
}): SizeGridColDef => {
  if (colRole === "nonGroup" && col.colId === "warehouse") {
    col = {
      ...col,
      editable: true,
      cellClass: classname(col.cellClass, "ag-cell-editable"),
      cellEditor: "agRichSelectCellEditor",
      cellEditorPopup: true,
      cellEditorParams: {
        values: data.warehouses,
        cellHeight: 20,
        formatValue: (warehouse: Warehouse) => warehouse.name,
        cellRenderer: RichSelectCellRenderer,
        searchDebounceDelay: 500,
      } satisfies Partial<
        Omit<IRichCellEditorParams, OmitCellEditorParamsForOptions>
      >,
    };
  }
  return col;
};
