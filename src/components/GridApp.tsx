import React, { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  GridReadyEvent,
  GridApi,
  ColumnApi,
  SideBarDef,
} from "ag-grid-community";

import { AppContextProvider } from "../hooks/useAppContext";
import {
  levels as allLevels,
  GridGroupDataItem,
  LevelItem,
} from "../interfaces";
import { getGridData } from "../helpers/dataSource";
import { wrap, nuPerf } from "../helpers/perf";
import { defaultLevels, testDataParams, getGridProps } from "./getGridProps";
import { LevelsToolPanel } from "./LevelsToolPanel";

const styles = {
  container: { width: "100%", height: "100%" },
  grid: { height: "100%", width: "100%" },
};

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

const GridApp: React.FC = () => {
  const gridApi = useRef<GridApi>();
  const columnApi = useRef<ColumnApi>();

  const [levelItems, setLevelItems] = useState(
    allLevels.map(
      (level): LevelItem => ({
        level,
        visible: defaultLevels.includes(level),
      })
    )
  );
  const [isBuildOrder, setIsBuildOrder] = useState(true);

  const appContext = useMemo(
    () => ({
      levelItems,
      setLevelItems,
      isBuildOrder,
      setIsBuildOrder,
    }),
    [levelItems, isBuildOrder]
  );

  const levels = useMemo(() => {
    const result = levelItems
      .filter((item) => item.visible)
      .map((item) => item.level);
    if (result.at(-1) === "product") {
      result.push("sizes");
    }
    return result;
  }, [levelItems]);

  const [settings, gridData] = useMemo(() => {
    const settings = {
      ...testDataParams,
      isBuildOrder,
    };
    return [settings, getGridData(settings)];
  }, [isBuildOrder]);

  const gridProps = useMemo(
    () => getGridProps(levels, gridData, appContext),
    [gridData, levels, appContext]
  );

  console.log("gridProps", gridProps);

  nuPerf.setContext({
    ...settings,
    rootItemCount: gridProps.rowData?.length ?? 0,
  });

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApi.current = params.api;
    columnApi.current = params.columnApi;
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.grid} className="ag-theme-alpine">
        <AppContextProvider value={appContext}>
          <AgGridReact<GridGroupDataItem>
            {...gridProps}
            sideBar={sideBar}
            onGridReady={onGridReady}
          />
        </AppContextProvider>
      </div>
    </div>
  );
};

export const GridAppPerf = wrap(GridApp, "GridApp", false);
