import { SideBarDef, ToolPanelColumnCompParams } from "ag-grid-community";
import { LevelsToolPanel } from "../components";

export const sideBar: SideBarDef = {
  toolPanels: [
    {
      id: "columns",
      labelDefault: "Columns",
      labelKey: "columns",
      iconKey: "columns",
      toolPanel: "agColumnsToolPanel",
      minWidth: 225,
      maxWidth: 225,
      width: 225,
      toolPanelParams: {
        suppressValues: true,
        suppressPivots: true,
      } as ToolPanelColumnCompParams,
    },
    {
      id: "filters",
      labelDefault: "Filters",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
      minWidth: 180,
      maxWidth: 400,
      width: 250,
    },
    {
      id: "nestingLevels",
      labelDefault: "Nesting Levels",
      labelKey: "nestingLevels",
      iconKey: "linked",
      minWidth: 180,
      maxWidth: 400,
      width: 250,
      toolPanel: LevelsToolPanel,
    },
  ],
  defaultToolPanel: "nestingLevels",
};
