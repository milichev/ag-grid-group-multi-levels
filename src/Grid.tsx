"use strict";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { render } from "react-dom";
import { AgGridReact, AgGridReactProps } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  GridReadyEvent,
  IDetailCellRendererParams,
  ICellRendererParams,
  GridApi,
  ColumnApi,
  SideBarDef
} from "ag-grid-community";

import { LevelsContextProvider } from "./appContext";
import { NestLevelToolPanel } from "./NestLevelToolPanel";
import {
  GridDataItem,
  Level,
  levels as allLevels,
  VisibleLevels,
  GridGroupDataItem,
  NestLevelItem
} from "./interfaces";
import { getGridData } from "./dataSource";
import { getColumnDefs, columnTypes } from "./getColumnDefs";
import { groupItems } from "./groupItems";
import { measureStep, wrap, nuPerf } from "./perf";

const testDataParams: Parameters<typeof getGridData>[0] = {
  productCount: 20,
  warehouseCount: 5,
  shipmentCount: 5,
  sizeGroupCount: 3
};

const defaultLevels: Level[] = [
  "product",
  "shipment",
  // "warehouse",
  "sizeGroup"
];

const origConsoleError = console.error.bind(console);
console.error = (...args) => {
  const { stack } = new Error();
  if (/outputMissingLicenseKey/.test(stack)) {
    return;
  }
  origConsoleError(...args);
};

const styles = {
  container: { width: "100%", height: "100%" },
  grid: { height: "100%", width: "100%" }
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
      width: 225
    },
    {
      id: "filters",
      labelDefault: "Filters",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
      minWidth: 180,
      maxWidth: 400,
      width: 250
    },
    {
      id: "nestingLevels",
      labelDefault: "Nesting Levels",
      labelKey: "nestingLevels",
      iconKey: "linked",
      minWidth: 180,
      maxWidth: 400,
      width: 250,
      toolPanel: NestLevelToolPanel
    }
  ],
  defaultToolPanel: "nestingLevels"
};

const defaultColDef = {
  flex: 1,
  minWidth: 100,
  enableValue: true,
  enableRowGroup: false,
  enablePivot: false,
  sortable: true,
  filter: true,
  resizable: true
};
const autoGroupColumnDef = {
  minWidth: 200
};
const commonGridProps: Partial<AgGridReactProps> = {
  defaultColDef,
  columnTypes,
  getRowNodeId: (data) => data.id,
  detailRowAutoHeight: true,
  singleClickEdit: true
};

const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels
): AgGridReactProps["detailCellRendererParams"] => {
  const level = levels[levelIndex];
  if (!level) return undefined;

  return (params: ICellRendererParams): Partial<IDetailCellRendererParams> => {
    const parentItem = params.data as GridGroupDataItem;

    const product =
      levels.indexOf("product") < levelIndex && parentItem.group[0].product;
    const hasSizeGroups = product?.sizes?.some((s) => !!s.sizeGroup);
    let localLevels = levels;
    if (product && !hasSizeGroups) {
      const sizeGroupIdx = levels.indexOf("sizeGroup");
      if (sizeGroupIdx > levelIndex) {
        localLevels = [...levels];
        localLevels.splice(sizeGroupIdx, 1);
      }
    }
    const detailCellRendererParams = getDetailRendererParams(
      gridData,
      localLevels,
      levelIndex + 1,
      visibleLevels
    );
    const columnDefs = getColumnDefs(
      localLevels,
      levelIndex,
      visibleLevels,
      product
    );
    const rows = groupItems(
      parentItem.group,
      localLevels,
      levelIndex,
      visibleLevels,
      parentItem
    );

    const result = {
      detailGridOptions: {
        ...commonGridProps,
        columnDefs,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams
      },
      getDetailRowData: (params) => {
        params.successCallback(rows);
      }
    };
    // console.log("detailCellRendererParams", result);
    return result;
  };
};

const getGridProps = (
  levels: Level[],
  gridData: GridDataItem[]
): Partial<AgGridReactProps> => {
  const level = levels[0];
  if (!level) {
    return {
      rowData: [],
      columnDefs: []
    };
  }
  const visibleLevels = levels.reduce((acc, level) => {
    acc[level] = true;
    return acc;
  }, {} as VisibleLevels);

  const rowData = groupItems(gridData, levels, 0, visibleLevels, null);
  const columnDefs = getColumnDefs(levels, 0, visibleLevels, null);
  const detailCellRendererParams = getDetailRendererParams(
    gridData,
    levels,
    1,
    visibleLevels
  );

  return {
    ...commonGridProps,
    rowData,
    columnDefs,
    masterDetail: !!detailCellRendererParams,
    detailCellRendererParams
  };
};

const App: React.FC = () => {
  const gridApi = useRef<GridApi>();
  const columnApi = useRef<ColumnApi>();
  const [gridData] = useState(getGridData(testDataParams));

  const [levelItems, setLevelItems] = useState(
    allLevels.map(
      (level): NestLevelItem => ({
        level,
        visible: defaultLevels.includes(level)
      })
    )
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

  const gridProps = useMemo(() => getGridProps(levels, gridData), [
    gridData,
    levelItems
  ]);

  // console.log("gridOptions", gridOptions);

  nuPerf.setContext({
    ...testDataParams,
    rootItemCount: gridProps.rowData.length
  });

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridApi.current = params.api;
    columnApi.current = params.columnApi;
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.grid} className="ag-theme-alpine">
        <LevelsContextProvider
          value={{
            levelItems,
            setLevelItems
          }}
        >
          <AgGridReact<GridGroupDataItem>
            {...gridProps}
            animateRows={true}
            autoGroupColumnDef={autoGroupColumnDef}
            sideBar={sideBar}
            detailRowAutoHeight={true}
            onGridReady={onGridReady}
          />
        </LevelsContextProvider>
      </div>
    </div>
  );
};

export const AppPerf = wrap(App, "GridExample", false);
