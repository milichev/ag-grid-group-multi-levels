import React, { useCallback, useMemo, useRef, useState } from "react";
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
  GetContextMenuItems,
  SideBarDef,
  MenuItemDef,
} from "ag-grid-community";

import { LevelsContextProvider } from "./appContext";
import { NestLevelToolPanel } from "./NestLevelToolPanel";
import {
  GridDataItem,
  Level,
  levels as allLevels,
  VisibleLevels,
  GridGroupDataItem,
  NestLevelItem,
} from "./interfaces";
import { getGridData } from "./dataSource";
import { getColumnDefs, columnTypes } from "./getColumnDefs";
import { groupItems } from "./groupItems";
import { wrap, nuPerf } from "./perf";

const testDataParams: Omit<Parameters<typeof getGridData>[0], "isBuildOrder"> =
  {
    productCount: 20,
    warehouseCount: 5,
    shipmentCount: 5,
    sizeGroupCount: 3,
  };

const defaultLevels: Level[] = [
  "product",
  "shipment",
  // "warehouse",
  "sizeGroup",
];

const origConsoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  const { stack } = new Error();
  if (stack && /outputMissingLicenseKey/.test(stack)) {
    return;
  }
  origConsoleError(...args);
};

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
      toolPanel: NestLevelToolPanel,
    },
  ],
  defaultToolPanel: "nestingLevels",
};

const defaultColDef = {
  flex: 1,
  minWidth: 100,
  enableValue: true,
  enableRowGroup: false,
  enablePivot: false,
  sortable: true,
  filter: true,
  resizable: true,
};
const autoGroupColumnDef = {
  minWidth: 200,
};
const commonGridProps: Partial<AgGridReactProps> = {
  defaultColDef,
  columnTypes,
  getRowNodeId: (data) => data.id,
  detailRowAutoHeight: true,
  singleClickEdit: true,
  allowContextMenuWithControlKey: true,
};

const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  isBuildOrder: boolean
): AgGridReactProps["detailCellRendererParams"] => {
  const level = levels[levelIndex];
  if (!level) return undefined;

  return (params: ICellRendererParams): Partial<IDetailCellRendererParams> => {
    const parentItem = params.data as GridGroupDataItem;

    const product =
      levels.indexOf("product") < levelIndex
        ? parentItem.group[0].product
        : null;
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
      visibleLevels,
      isBuildOrder
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

    const result: Partial<IDetailCellRendererParams> = {
      detailGridOptions: {
        ...commonGridProps,
        columnDefs,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
        getContextMenuItems: getContextMenuHandler({
          levels,
          levelIndex,
          isBuildOrder,
        }),
      },
      getDetailRowData: (params) => {
        params.successCallback(rows);
      },
    };
    // console.log("detailCellRendererParams", result);
    return result;
  };
};

const getGridProps = (
  levels: Level[],
  gridData: GridDataItem[],
  isBuildOrder: boolean
): Partial<AgGridReactProps<GridGroupDataItem>> => {
  const level = levels[0];
  if (!level) {
    return {
      rowData: [],
      columnDefs: [],
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
    visibleLevels,
    isBuildOrder
  );

  return {
    ...commonGridProps,
    rowData,
    columnDefs,
    masterDetail: !!detailCellRendererParams,
    detailCellRendererParams,
    getContextMenuItems: getContextMenuHandler({
      levels,
      levelIndex: 0,
      isBuildOrder,
    }),
  };
};

const getContextMenuHandler =
  ({
    levels,
    levelIndex,
    isBuildOrder,
  }: {
    levels: Level[];
    levelIndex: number;
    isBuildOrder: boolean;
  }): GetContextMenuItems<GridGroupDataItem> =>
  (params) => {
    const menuItems: (string | MenuItemDef)[] = [];

    switch (levels[levelIndex]) {
      case "product":
        menuItems.push({
          name: "Remove Product",
        });
        break;
      case "shipment":
        if (!isBuildOrder) {
          menuItems.push({
            name: "Remove Shipment",
          });
        }
        break;
    }

    switch (levels[levelIndex + 1]) {
      case "shipment":
        if (!isBuildOrder) {
          menuItems.push({
            name: "Add Shipment",
            subMenu: [
              {
                name: "Delivery Window 1",
              },
              {
                name: "Delivery Window 2",
              },
              {
                name: "Pick Dates...",
              },
            ],
          });
        }
        break;
    }

    return menuItems;
  };

const GridApp: React.FC = () => {
  const gridApi = useRef<GridApi>();
  const columnApi = useRef<ColumnApi>();

  const [levelItems, setLevelItems] = useState(
    allLevels.map(
      (level): NestLevelItem => ({
        level,
        visible: defaultLevels.includes(level),
      })
    )
  );
  const [isBuildOrder, setIsBuildOrder] = useState(true);

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
    () => getGridProps(levels, gridData, isBuildOrder),
    [gridData, levels, isBuildOrder]
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
        <LevelsContextProvider
          value={{
            levelItems,
            setLevelItems,
            isBuildOrder,
            setIsBuildOrder,
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

export const GridAppPerf = wrap(GridApp, "GridApp", false);
