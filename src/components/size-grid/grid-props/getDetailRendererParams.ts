import {
  GridDataItem,
  GridGroupDataItem,
  Level,
  LevelIndices,
} from "../../../data/types";
import { AppContext } from "../../../hooks/useAppContext";
import { GridContext, SizeGridColDef, SizeGridProps } from "../types";
import { AgGridReactProps } from "ag-grid-react";
import {
  ICellRendererParams,
  IDetailCellRendererParams,
} from "ag-grid-community";
import { measureStep } from "../../../helpers/perf";
import { collectEntities } from "../../../data/resolvers";
import { getAutoGroupColumnDef, getColumnDefs } from "./getColumnDefs";
import { groupItems } from "../../../data/groupItems";
import { columnTypes } from "./columnTypes";
import { getContextMenuItems } from "./getContextMenuItems";
import { getMainMenuItems } from "./getMainMenuItems";
import { onColumnRowGroupChanged } from "./onColumnRowGroupChanged";
import { postProcessPopup } from "./postProcessPopup";
import { onRowDataUpdated } from "./onRowDataUpdated";
import { onCellValueChanged } from "./onCellValueChanged";
import { getLevelIndices } from "../../../data/levels";

const defaultColDef: SizeGridColDef = {
  flex: 1,
  minWidth: 100,
  enableValue: true,
  enableRowGroup: false,
  enablePivot: false,
  sortable: true,
  filter: true,
  resizable: true,
};

export const commonGridProps: Partial<SizeGridProps> = {
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

export const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  levelIndices: LevelIndices,
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
      levelIndices.product < levelIndex ? item.group[0].product : null;
    const hasSizeGroups = product?.sizes?.some((s) => !!s.sizeGroup);

    // level info for the currently expanded parent item
    let currentLevel = level;
    let localLevels = levels;
    let localLevelIndices = levelIndices;

    // remove unneeded sizeGroup nested level, if any
    if (product && !hasSizeGroups) {
      if (levelIndices.sizeGroup >= levelIndex) {
        localLevels = levels.slice();
        localLevels.splice(levelIndices.sizeGroup, 1);
        currentLevel = localLevels[levelIndex];
        if (localLevels.length === levelIndex && !appContext.isFlattenSizes) {
          localLevels.push("sizes");
        }
        localLevelIndices = getLevelIndices(localLevels);
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
      localLevelIndices,
      appContext,
      context
    );

    const allProducts = appContext.isFlattenSizes
      ? [...collectEntities(item.group).products.values()]
      : [];

    const columnDefs = getColumnDefs({
      levels: localLevels,
      levelIndex,
      levelIndices: localLevelIndices,
      product,
      appContext,
      allProducts,
      columnApi: null,
    });

    const { items } = groupItems(
      item.group,
      localLevels,
      levelIndex,
      localLevelIndices,
      item
    );

    // noinspection UnnecessaryLocalVariableJS
    const result: Partial<IDetailCellRendererParams> = {
      detailGridOptions: {
        ...commonGridProps,
        autoGroupColumnDef: getAutoGroupColumnDef(currentLevel),
        columnDefs,
        context,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
      },
      getDetailRowData: (params) => {
        params.successCallback(items);
      },
    };

    const parentLevel = masterContext.levels[masterContext.levelIndex];
    const parentEntity = item[parentLevel] as any;
    console.log(
      `detailCellRendererParams ${parentLevel}: ${
        parentEntity?.name || parentEntity?.id
      }`,
      result,
      items
    );

    getParamsStep.finish();
    return result;
  };
};
