import { ColumnApi, GridApi } from "ag-grid-community";

import { GridDataItem, Level, Product } from "../../../data/types";
import { getAutoGroupColumnDef, getColDefs } from "../columns";
import { groupItems } from "../../../data/groupItems";
import { SizeGridContext, SizeGridLevelContext, SizeGridProps } from "../types";
import { collectEntities } from "../../../data/resolvers";
import { getLevelIndices } from "../../../data/levels";
import { getDetailRendererParams } from "./getDetailRendererParams";
import { wrap } from "../../../helpers/perf";
import { commonGridProps } from "./commonGridProps";
import { getEventHandlers } from "../event-handlers";

export const getGridProps = wrap(
  (
    levels: Level[],
    gridData: GridDataItem[],
    sizeGridContext: SizeGridContext,
    popupParent: HTMLElement | null,
    gridApi: GridApi | null,
    columnApi: ColumnApi | null
  ) => {
    const level = levels[0];
    if (!level) {
      return {
        rowData: [],
        columnDefs: [],
      };
    }
    const levelIndices = getLevelIndices(levels);

    const allProducts =
      sizeGridContext.isFlattenSizes && level === "product"
        ? [
            ...collectEntities(gridData, {
              products: new Map<Product["id"], Product>(),
            }).products.values(),
          ]
        : [];

    const { items } = groupItems(gridData, levels, 0, levelIndices, null);

    const columnDefs = getColDefs({
      levels,
      levelIndex: 0,
      levelIndices,
      product: null,
      sizeGridContext,
      allProducts,
      columnApi,
    });

    const context: SizeGridLevelContext = {
      levels,
      levelIndex: 0,
      sizeGridContext,
      master: null,
    };

    const detailCellRendererParams = getDetailRendererParams(
      gridData,
      levels,
      1,
      levelIndices,
      sizeGridContext,
      popupParent,
      context
    );

    return {
      ...commonGridProps,
      ...getEventHandlers(context),
      autoGroupColumnDef: getAutoGroupColumnDef(level),
      rowData: items,
      // quickFilterText: gridData[0].product.department,
      columnDefs,
      masterDetail: !!detailCellRendererParams,
      detailCellRendererParams,
      popupParent,
      context,
    } satisfies Partial<SizeGridProps>;
  },
  "getGridProps",
  false
);
