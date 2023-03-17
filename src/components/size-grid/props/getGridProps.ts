import { ColumnApi, GridApi } from "ag-grid-community";

import { Level, Product, SizeGridData } from "../../../data/types";
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
    data: SizeGridData,
    sizeGridContext: SizeGridContext,
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
            ...collectEntities(data.items, {
              products: new Map<Product["id"], Product>(),
            }).products.values(),
          ]
        : [];

    const { items } = groupItems(data.items, levels, 0, levelIndices, null);

    const columnDefs = getColDefs({
      levels,
      levelIndex: 0,
      levelIndices,
      data,
      product: null,
      sizeGridContext,
      allProducts,
      columnApi,
    });

    const context: SizeGridLevelContext = {
      levels,
      levelIndex: 0,
      getData: () => data,
      sizeGridContext,
      master: null,
    };

    const detailCellRendererParams = getDetailRendererParams(
      data,
      levels,
      1,
      levelIndices,
      sizeGridContext,
      context
    );

    return {
      ...commonGridProps,
      ...getEventHandlers(context),
      autoGroupColumnDef: getAutoGroupColumnDef(level),
      rowData: items,
      // quickFilterText: data[0].product.department,
      columnDefs,
      masterDetail: !!detailCellRendererParams,
      detailCellRendererParams,
      popupParent: sizeGridContext.getPopupParent(),
      context,
    } satisfies Partial<SizeGridProps>;
  },
  "getGridProps",
  false
);
