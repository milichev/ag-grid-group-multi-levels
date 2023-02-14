import {
  ColDef,
  ICellRendererParams,
  IDetailCellRendererParams,
} from "ag-grid-community";
import { AgGridReactProps } from "ag-grid-react";

import type { AppContext, GridContext } from "../../../hooks/useAppContext";
import {
  GridDataItem,
  GridGroupDataItem,
  Level,
  SelectableLevel,
  VisibleLevels,
} from "../../../interfaces";
import { getAutoGroupColumnDef, getColumnDefs } from "./getColumnDefs";
import { groupItems } from "../../../helpers/groupItems";
import { getMainMenuItems } from "./getMainMenuItems";
import { postProcessPopup } from "./postProcessPopup";
import { getContextMenuItems } from "./getContextMenuItems";
import { onColumnRowGroupChanged } from "./onColumnRowGroupChanged";
import { columnTypes } from "./columnTypes";
import { onRowDataUpdated } from "./onRowDataUpdated";
import { measureStep } from "../../../helpers/perf";

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
  appContext: AppContext
): AgGridReactProps["detailCellRendererParams"] => {
  const level = levels[levelIndex];
  if (!level) return undefined;

  return (
    params: ICellRendererParams
  ): Partial<IDetailCellRendererParams<GridGroupDataItem>> => {
    const getParamsStep = measureStep({
      name: "detailRendererParams",
      async: false,
    });
    const parentItem = params.data;

    const product =
      levels.indexOf("product") < levelIndex
        ? parentItem.group[0].product
        : null;
    const hasSizeGroups = product?.sizes?.some((s) => !!s.sizeGroup);
    let localLevels = levels;

    // remove unneeded sizeGroup nested level, if any
    if (product && !hasSizeGroups) {
      const sizeGroupIdx = levels.indexOf("sizeGroup");
      if (sizeGroupIdx >= levelIndex) {
        localLevels = [...levels];
        localLevels.splice(sizeGroupIdx, 1);
        if (localLevels.length === levelIndex) {
          localLevels.push("sizes");
        }
      }
    }

    const detailCellRendererParams = getDetailRendererParams(
      gridData,
      localLevels,
      levelIndex + 1,
      visibleLevels,
      appContext
    );
    const columnDefs = getColumnDefs({
      levels: localLevels,
      levelIndex,
      visibleLevels,
      product,
      appContext,
    });
    const rows = groupItems(
      parentItem.group,
      localLevels,
      levelIndex,
      visibleLevels,
      parentItem
    );

    const context: GridContext = {
      levels: localLevels,
      levelIndex,
      appContext,
    };

    // noinspection UnnecessaryLocalVariableJS
    const result: Partial<IDetailCellRendererParams> = {
      detailGridOptions: {
        ...commonGridProps,
        autoGroupColumnDef: getAutoGroupColumnDef(level),
        columnDefs,
        context,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
      },
      getDetailRowData: (params) => {
        params.successCallback(rows);
      },
    };

    // console.log("detailCellRendererParams", result);
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
  const visibleLevels = levels.reduce((acc, level) => {
    acc[level] = true;
    return acc;
  }, {} as VisibleLevels);

  const rowData = groupItems(gridData, levels, 0, visibleLevels, null);
  const columnDefs = getColumnDefs({
    levels,
    levelIndex: 0,
    visibleLevels,
    product: null,
    appContext,
  });
  const detailCellRendererParams = getDetailRendererParams(
    gridData,
    levels,
    1,
    visibleLevels,
    appContext
  );

  const context: GridContext = {
    levels,
    levelIndex: 0,
    appContext,
  };

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
