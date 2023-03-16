import { SizeGridLevelContext, SizeGridProps } from "../types";
import { getContextMenuItems } from "./getContextMenuItems";
import { getMainMenuItems } from "./getMainMenuItems";
import { postProcessPopup } from "./postProcessPopup";
import { onRowDataUpdated } from "./onRowDataUpdated";
import { onCellValueChanged } from "./onCellValueChanged";
import { isSelectableLevel, toggleLevelItem } from "../../../data/levels";
import { gaEvents } from "../../../helpers/ga";

export const getEventHandlers = (context: SizeGridLevelContext) => {
  const onColumnRowGroupChanged: SizeGridProps["onColumnRowGroupChanged"] = (
    params
  ) => {
    // TODO: ag-grid@29 context is in params
    const { levelIndex, levels, sizeGridContext } = context;
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

  return {
    getContextMenuItems,
    getMainMenuItems,
    onRowGroupOpened: (params) => {
      console.log("onRowGroupOpened", params);
    },
    onColumnRowGroupChanged,
    postProcessPopup,
    onRowDataUpdated,
    onCellValueChanged,
    onCellEditingStarted: (params) => {
      if (
        params.colDef.type === "quantityColumn" &&
        params.value === undefined
      ) {
        params.api.stopEditing(true);
      }
    },
  } satisfies Partial<SizeGridProps>;
};
