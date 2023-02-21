import { SelectableLevel } from "../../../types";
import { GetMainMenuItemsParams, MenuItemDef } from "ag-grid-community";
import { getVisibleLevels, toggleLevelItem } from "../../../helpers/levels";
import { GridContext, SizeGridProps } from "../types";
import { allLevels } from "../../../constants";

export const getMainMenuItems: SizeGridProps["getMainMenuItems"] = (params) => {
  const result: (string | MenuItemDef)[] = params.defaultItems.slice();
  const level = params.column?.getColId() as SelectableLevel;
  const isSelectableLevel = allLevels.includes(level);
  if (isSelectableLevel) {
    preprocessLevel(level, params, result);
  }
  return result;
};

function preprocessLevel(
  level: SelectableLevel,
  params: GetMainMenuItemsParams,
  result: (string | MenuItemDef)[]
) {
  const {
    levelIndex,
    levels,
    appContext: { levelItems, setLevelItems },
  }: GridContext = params.context;
  const visibleLevels = getVisibleLevels(levels);

  if (levelIndex === 0 && visibleLevels[level] === undefined) {
    const groupLevelItem: MenuItemDef = {
      name: `Group by ${params.column.getColDef().headerName}`,
      icon: '<span class="ag-icon ag-icon-group" role="presentation" />',
      action: () => {
        toggleLevelItem(level, true, { levelItems, setLevelItems });
      },
    };
    const rowGroupIndex = result.indexOf("rowGroup");
    if (rowGroupIndex > -1) {
      result.splice(rowGroupIndex, 1, groupLevelItem);
    } else {
      result.splice(result.lastIndexOf("separator"), 0, groupLevelItem);
    }
  } else if (
    level !== "product" &&
    visibleLevels[level] === levelIndex &&
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
