import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem, Level, SelectableLevel } from "../../../interfaces";
import { GridContext } from "../../../hooks/useAppContext";
import { toggleLevelItem } from "../../../helpers/levels";
import { levels as allLevels } from "../../../constants";

export const onColumnRowGroupChanged: AgGridReactProps<GridGroupDataItem>["onColumnRowGroupChanged"] =
  (params) => {
    const { levelIndex, levels, appContext }: GridContext = params.context;
    console.log("onColumnRowGroupChanged", { levelIndex, levels, params });

    const groupColLevel = params.column?.getColId() as SelectableLevel;
    if (allLevels.includes(groupColLevel)) {
      toggleLevelItem(groupColLevel, true, appContext);
    } else {
      const levelColumn = params.columnApi.getColumn(levels[levelIndex]);
      if (levelColumn) {
        params.columnApi.setColumnsVisible(
          [levelColumn],
          params.columns.length === 0
        );
      }
    }
  };
