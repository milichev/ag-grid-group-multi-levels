import { ColumnApi, GridApi } from "ag-grid-community";

import type { SizeGridContext } from "../../../hooks/useSizeGridContext";
import { GridDataItem, Level, Product } from "../../../data/types";
import { getAutoGroupColumnDef, getColumnDefs } from "./getColumnDefs";
import { groupItems } from "../../../data/groupItems";
import { GridContext, SizeGridProps } from "../types";
import { collectEntities } from "../../../data/resolvers";
import { getLevelIndices } from "../../../data/levels";
import { getDetailRendererParams } from "./getDetailRendererParams";
import { wrap } from "../../../helpers/perf";
import { commonGridProps } from "./commonGridProps";

export const getGridProps = wrap(
  (
    levels: Level[],
    gridData: GridDataItem[],
    sizeGridContext: SizeGridContext,
    gridApi: GridApi | null,
    columnApi: ColumnApi | null
  ): Partial<SizeGridProps> => {
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

    const columnDefs = getColumnDefs({
      levels,
      levelIndex: 0,
      levelIndices,
      product: null,
      sizeGridContext,
      allProducts,
      columnApi,
    });

    const context: GridContext = {
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
      context
    );

    return {
      ...commonGridProps,
      autoGroupColumnDef: getAutoGroupColumnDef(level),
      rowData: items,
      // quickFilterText: gridData[0].product.department,
      columnDefs,
      masterDetail: !!detailCellRendererParams,
      detailCellRendererParams,
      context,
    };
  },
  "getGridProps",
  false
);
