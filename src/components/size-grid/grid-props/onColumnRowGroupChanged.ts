import { isSelectableLevel, toggleLevelItem } from "../../../data/levels";
import { GridContext, SizeGridProps } from "../types";
import { gaEvents } from "../../../helpers/ga";

export const onColumnRowGroupChanged: SizeGridProps["onColumnRowGroupChanged"] =
  (params) => {
    const { levelIndex, levels, sizeGridContext }: GridContext = params.context;
    console.log("onColumnRowGroupChanged", { levelIndex, levels, params });

    const colId = params.column?.getColId();
    gaEvents.rowGroup(colId, params.columns.length);

    if (isSelectableLevel(colId)) {
      params.columnApi.removeRowGroupColumn(colId);
      toggleLevelItem(colId, true, sizeGridContext);
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
