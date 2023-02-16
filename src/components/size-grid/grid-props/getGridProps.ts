import {
  ColDef,
  ICellRendererParams,
  IDetailCellRendererParams,
} from "ag-grid-community";
import { AgGridReactProps } from "ag-grid-react";

import type { AppContext } from "../../../hooks/useAppContext";
import {
  GridDataItem,
  GridGroupDataItem,
  Level,
  VisibleLevels,
} from "../../../types";
import { getAutoGroupColumnDef, getColumnDefs } from "./getColumnDefs";
import { groupItems } from "../../../helpers/groupItems";
import { getMainMenuItems } from "./getMainMenuItems";
import { postProcessPopup } from "./postProcessPopup";
import { getContextMenuItems } from "./getContextMenuItems";
import { onColumnRowGroupChanged } from "./onColumnRowGroupChanged";
import { columnTypes } from "./columnTypes";
import { onRowDataUpdated } from "./onRowDataUpdated";
import { measureStep } from "../../../helpers/perf";
import { onCellValueChanged } from "./onCellValueChanged";
import { GridContext } from "../types";
import { collectEntities } from "../../../helpers/resolvers";

const defaultColDef: ColDef<GridGroupDataItem> = {
  flex: 1,
  minWidth: 100,
  enableValue: true,
  enableRowGroup: false,
  enablePivot: false,
  sortable: true,
  filter: true,
  resizable: true,
};

const commonGridProps: Partial<AgGridReactProps<GridGroupDataItem>> = {
  defaultColDef,
  columnTypes,
  animateRows: true,
  suppressAutoSize: false,
  detailRowAutoHeight: true,
  singleClickEdit: true,
  stopEditingWhenCellsLoseFocus: true,
  undoRedoCellEditing: true,
  enableCellEditingOnBackspace: true,
  allowContextMenuWithControlKey: true,
  suppressAggFuncInHeader: true,
  enableCellChangeFlash: true,
  getRowId: (params) => params.data.id,
  onRowGroupOpened: (params) => console.log("onRowGroupOpened", params),
  getContextMenuItems,
  getMainMenuItems,
  onColumnRowGroupChanged,
  postProcessPopup,
  onRowDataUpdated,
  onCellValueChanged,
  onCellEditingStarted: (params) => {
    if (params.colDef.type === "quantityColumn" && params.value === undefined) {
      params.api.stopEditing(true);
    }
  },
};

/*
Object.keys(commonGridProps).forEach((key) => {
  if (typeof commonGridProps[key] === "function") {
    commonGridProps[key] = wrap(commonGridProps[key], key, false);
  }
});
*/

const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  appContext: AppContext,
  masterContext: GridContext
): AgGridReactProps["detailCellRendererParams"] => {
  const level = levels[levelIndex];
  if (!level) return undefined;

  return (
    params: ICellRendererParams<GridGroupDataItem>
  ): Partial<IDetailCellRendererParams<GridGroupDataItem>> => {
    const getParamsStep = measureStep({
      name: "detailRendererParams",
      async: false,
    });
    const item = params.data;

    const product =
      visibleLevels.product < levelIndex ? item.group[0].product : null;
    const hasSizeGroups = product?.sizes?.some((s) => !!s.sizeGroup);
    let localLevels = levels;

    // remove unneeded sizeGroup nested level, if any
    if (product && !hasSizeGroups) {
      if (visibleLevels.sizeGroup >= levelIndex) {
        localLevels = [...levels];
        localLevels.splice(visibleLevels.sizeGroup, 1);
        if (localLevels.length === levelIndex) {
          localLevels.push("sizes");
        }
      }
    }

    const context: GridContext = {
      levels: localLevels,
      levelIndex,
      appContext,
      master: {
        id: params.data.id,
        api: params.api,
        columnApi: params.columnApi,
        context: masterContext,
      },
    };
    const detailCellRendererParams = getDetailRendererParams(
      gridData,
      localLevels,
      levelIndex + 1,
      visibleLevels,
      appContext,
      context
    );

    const allProducts = appContext.isFlattenSizes
      ? [...collectEntities(item.group).products.values()]
      : [];

    const columnDefs = getColumnDefs({
      levels: localLevels,
      levelIndex,
      visibleLevels,
      product,
      appContext,
      allProducts,
    });

    const rows = groupItems(
      item.group,
      localLevels,
      levelIndex,
      visibleLevels,
      item
    );

    // noinspection UnnecessaryLocalVariableJS
    const result: Partial<IDetailCellRendererParams> = {
      detailGridOptions: {
        ...commonGridProps,
        autoGroupColumnDef: getAutoGroupColumnDef(level),
        columnDefs,
        context,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
        // sideBar: {
        //   toolPanels: ["columns", "filters"],
        // },
      },
      getDetailRowData: (params) => {
        params.successCallback(rows);
      },
    };

    const parentLevel = masterContext.levels[masterContext.levelIndex];
    const parentEntity = item[parentLevel] as any;
    console.log(
      `detailCellRendererParams ${parentLevel}: ${
        parentEntity?.name || parentEntity?.id
      }`,
      result,
      rows
    );

    getParamsStep.finish();
    return result;
  };
};

export const getGridProps = (
  levels: Level[],
  gridData: GridDataItem[],
  appContext: AppContext
): Partial<AgGridReactProps<GridGroupDataItem>> => {
  const level = levels[0];
  if (!level) {
    return {
      rowData: [],
      columnDefs: [],
    };
  }
  const visibleLevels = levels.reduce((acc, level, i) => {
    acc[level] = i;
    return acc;
  }, {} as VisibleLevels);

  const allProducts =
    appContext.isFlattenSizes && level === "product"
      ? [...collectEntities(gridData).products.values()]
      : [];

  const rowData = groupItems(gridData, levels, 0, visibleLevels, null);

  const columnDefs = getColumnDefs({
    levels,
    levelIndex: 0,
    visibleLevels,
    product: null,
    appContext,
    allProducts,
  });

  const context: GridContext = {
    levels,
    levelIndex: 0,
    appContext,
    master: null,
  };

  const detailCellRendererParams = getDetailRendererParams(
    gridData,
    levels,
    1,
    visibleLevels,
    appContext,
    context
  );

  return {
    ...commonGridProps,
    autoGroupColumnDef: getAutoGroupColumnDef(level),
    rowData,
    // quickFilterText: gridData[0].product.department,
    columnDefs,
    masterDetail: !!detailCellRendererParams,
    detailCellRendererParams,
    context,
  };
};
