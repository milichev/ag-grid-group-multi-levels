import {
  IDetailCellRendererParams,
  ICellRendererParams,
  MenuItemDef,
} from "ag-grid-community";
import { AgGridReactProps } from "ag-grid-react";

import type { AppContext, GridContext } from "./appContext";
import {
  GridDataItem,
  Level,
  VisibleLevels,
  GridGroupDataItem,
} from "./interfaces";
import { getGridData } from "./dataSource";
import { getColumnDefs, columnTypes } from "./getColumnDefs";
import { groupItems } from "./groupItems";
import { getLevelIndex, toggleLevelItem } from "./levels";

export const testDataParams: Omit<
  Parameters<typeof getGridData>[0],
  "isBuildOrder"
> = {
  productCount: 20,
  warehouseCount: 5,
  shipmentCount: 5,
  sizeGroupCount: 3,
};

export const defaultLevels: Level[] = [
  "product",
  "shipment",
  // "warehouse",
  "sizeGroup",
];

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
  autoGroupColumnDef,
  animateRows: true,
  suppressAutoSize: false,
  detailRowAutoHeight: true,
  singleClickEdit: true,
  allowContextMenuWithControlKey: true,
  getRowNodeId: (data) => data.id,
};

const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  appContext: AppContext
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
      levels,
      levelIndex,
      appContext,
    };

    const result: Partial<IDetailCellRendererParams> = {
      detailGridOptions: {
        ...commonGridProps,
        columnDefs,
        context,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
        getContextMenuItems,
        getMainMenuItems,
      },
      getDetailRowData: (params) => {
        params.successCallback(rows);
      },
    };
    // console.log("detailCellRendererParams", result);
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
    rowData,
    columnDefs,
    masterDetail: !!detailCellRendererParams,
    detailCellRendererParams,
    context,
    getContextMenuItems,
    postProcessPopup,
    getMainMenuItems,
  };
};

const getMainMenuItems: AgGridReactProps<GridGroupDataItem>["getMainMenuItems"] =
  (params) => {
    const {
      levelIndex,
      appContext: { levelItems, setLevelItems },
    }: GridContext = params.context;

    const result: (string | MenuItemDef)[] = params.defaultItems.slice();
    const level = params.column?.getColId() as Level;
    const levelItemIndex = getLevelIndex(levelItems, level);
    if (levelItemIndex >= 0) {
      if (levelIndex === 0 && !levelItems[levelItemIndex].visible) {
        result.push({
          name: `Group by ${params.column.getColDef().headerName}`,
          action: () => {
            toggleLevelItem(level, true, { levelItems, setLevelItems });
          },
        });
      } else if (
        levelIndex > 0 &&
        level !== "product" &&
        levelItems[levelItemIndex].visible &&
        params.column.isPinnedLeft()
      ) {
        result.push({
          name: `Ungroup by ${params.column.getColDef().headerName}`,
          action: () => {
            toggleLevelItem(level, false, { levelItems, setLevelItems });
          },
        });
      }
    }

    return result;
  };

const postProcessPopup: AgGridReactProps<GridGroupDataItem>["postProcessPopup"] =
  (params) => {
    if (params.type !== "columnMenu") {
      return;
    }

    const {
      appContext: { levelItems },
    }: GridContext = params.context;

    const colId = params.column?.getColId() as Level;
    const levelItemIndex = getLevelIndex(levelItems, colId);
    if (levelItemIndex >= 0) {
      const ePopup = params.ePopup;
      let oldTopStr = ePopup.style.top!;
      // remove 'px' from the string (AG Grid uses px positioning)
      oldTopStr = oldTopStr.substring(0, oldTopStr.indexOf("px"));
      const oldTop = parseInt(oldTopStr);
      const newTop = oldTop + 25;
      ePopup.style.top = newTop + "px";
    }
  };

const getContextMenuItems: AgGridReactProps<GridGroupDataItem>["getContextMenuItems"] =
  (params) => {
    console.log("ctx menu", params);
    const {
      levels,
      levelIndex,
      appContext: { isBuildOrder },
    }: GridContext = params.context;
    const gridItem = params.node.data;
    const menuItems: (string | MenuItemDef)[] = [];

    switch (levels[levelIndex]) {
      case "product":
        menuItems.push({
          name: "Remove Product",
          action: () => {
            alert(`Here we'll delete the product ${gridItem.product.name}`);
          },
        });
        break;
      case "shipment":
        if (!isBuildOrder) {
          menuItems.push(
            {
              name: "Change Dates...",
              action: () => {
                alert(`Here we'll display a dialog with calendar`);
              },
            },
            {
              name: "Remove Shipment",
              action: () => {
                alert(`Here we'll delete the shipment ${gridItem.shipment.id}`);
              },
            }
          );
        } else {
          menuItems.push({
            name: "Cannot remove shipments in Build Order",
            disabled: true,
          });
        }
        break;
    }

    const childLevel = levels[levelIndex + 1];
    switch (childLevel) {
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
      case "warehouse":
        if (!isBuildOrder) {
          menuItems.push({
            name: "Add a Warehouse",
            subMenu: [
              {
                name: "Unlisted Warehouse 1",
              },
              {
                name: "Unlisted Warehouse 1",
              },
            ],
          });
        }
        break;
    }

    return menuItems;
  };
