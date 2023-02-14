import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem } from "../../../interfaces";
import { GridContext } from "../../../hooks/useAppContext";

export const onColumnRowGroupChanged: AgGridReactProps<GridGroupDataItem>["onColumnRowGroupChanged"] =
  (params) => {
    const {
      levels,
      levelIndex,
      appContext: { shipmentsMode },
    }: GridContext = params.context;
    console.log("onColumnRowGroupChanged", { levels, levelIndex, params });

    const levelColumn = params.columnApi.getColumn(levels[levelIndex]);
    if (levelColumn) {
      params.columnApi.setColumnsVisible(
        [levelColumn],
        params.columns.length === 0
      );
    }
  };
