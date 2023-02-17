import React, { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  ColumnApi,
  GridApi,
  GridReadyEvent,
  SideBarDef,
} from "ag-grid-community";

import { useAppContext } from "../../hooks/useAppContext";
import { GridDataItem, GridGroupDataItem, Level, Shipment } from "../../types";
import { getGridProps } from "./grid-props/getGridProps";
import { LevelsToolPanel } from "../LevelsToolPanel";
import { nuPerf } from "../../helpers/perf";
import { prepareItems } from "../../helpers/prepareItems";
import { ToolPanelColumnCompParams } from "ag-grid-community/dist/lib/interfaces/iToolPanel";

const sideBar: SideBarDef = {
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

export const Grid: React.FC<{
  levels: Level[];
  items: GridDataItem[];
  buildOrderShipments: Shipment[];
}> = ({ levels, items, buildOrderShipments }) => {
  const gridApi = useRef<GridApi>();
  const columnApi = useRef<ColumnApi>();
  const appContext = useAppContext();
  const { shipmentsMode, isAllDeliveries } = appContext;

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApi.current = params.api;
    columnApi.current = params.columnApi;
  }, []);

  const itemsToDisplay = useMemo(
    () =>
      prepareItems({
        shipmentsMode,
        isAllDeliveries,
        items,
        buildOrderShipments,
      }),
    [shipmentsMode, isAllDeliveries, items, buildOrderShipments]
  );

  const gridProps = useMemo(() => {
    const result = getGridProps(levels, itemsToDisplay, appContext);
    nuPerf.setContext({
      itemsSource: items.length,
      itemsGrid: itemsToDisplay.length,
      itemsTop: result.rowData?.length ?? 0,
    });
    return result;
  }, [levels, itemsToDisplay, appContext, items.length]);

  console.log("gridProps", gridProps);

  return (
    <AgGridReact<GridGroupDataItem>
      {...gridProps}
      sideBar={sideBar}
      onGridReady={onGridReady}
    />
  );
};
