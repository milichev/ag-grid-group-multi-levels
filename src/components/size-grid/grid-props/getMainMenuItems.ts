import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem, Level } from "../../../types";
import { MenuItemDef } from "ag-grid-community";
import { getLevelIndex, toggleLevelItem } from "../../../helpers/levels";
import { GridContext, SizeGridProps } from "../types";

export const getMainMenuItems: SizeGridProps["getMainMenuItems"] = (params) => {
  const {
    levelIndex,
    appContext: { levelItems, setLevelItems },
  }: GridContext = params.context;

  const result: (string | MenuItemDef)[] = params.defaultItems.slice();
  const level = params.column?.getColId() as Level;
  const levelItemIndex = getLevelIndex(levelItems, level);

  if (levelItemIndex >= 0) {
    if (levelIndex === 0 && !levelItems[levelItemIndex].visible) {
      // result.splice(result.lastIndexOf("separator"), 0, {
      //   name: `Group by ${params.column.getColDef().headerName}`,
      //   icon: '<span class="ag-icon ag-icon-group" role="presentation" />',
      //   action: () => {
      //     toggleLevelItem(level, true, { levelItems, setLevelItems });
      //   },
      // });
    } else if (
      levelIndex > 0 &&
      level !== "product" &&
      levelItems[levelItemIndex].visible &&
      params.column.isPinnedLeft()
    ) {
      result.splice(result.lastIndexOf("separator"), 0, {
        name: `Ungroup by ${params.column.getColDef().headerName}`,
        icon: '<span class="ag-icon ag-icon-group" role="presentation" />',
        action: () => {
          toggleLevelItem(level, false, { levelItems, setLevelItems });
        },
      });
    }
  }

  return result;
};
