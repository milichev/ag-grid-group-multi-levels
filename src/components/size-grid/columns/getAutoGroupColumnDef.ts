import { IGroupCellRendererParams } from "ag-grid-community";
import pluralize from "pluralize";
import type { GridGroupDataItem, Level } from "../../../data/types";
import type {
  SizeGridCellRendererOptions,
  SizeGridColDef,
  SizeGridLevelContext,
} from "../types";
import { groupCols, selectableCols } from "./col-defs";
import { GroupColumnInnerRenderer } from "../components";

export const getAutoGroupColumnDef = (level: Level): SizeGridColDef => {
  const baseColDef: SizeGridColDef = {
    ...(groupCols[level] || {}),
    ...(selectableCols[level] || {}),
  };

  const cellRendererParams = {
    footerValueGetter: (params) => {
      const { levels, levelIndex }: SizeGridLevelContext = params.context;
      const level = levels[levelIndex];
      // const isRootLevel = params.node.level === -1;
      // if (isRootLevel) {
      //   return "Grand Total";
      // }
      const uniqueByLevel = new Set(
        params.node.allLeafChildren.map((node) => node.data[level])
      );
      return pluralize(baseColDef.headerName, uniqueByLevel.size, true);
    },
    innerRenderer: GroupColumnInnerRenderer,
    innerRendererParams: {} satisfies SizeGridCellRendererOptions,
  } satisfies IGroupCellRendererParams<GridGroupDataItem>;

  return {
    minWidth: 200,
    cellRenderer: "agGroupCellRenderer",
    field: baseColDef.field,
    valueGetter: baseColDef.valueGetter,
    valueFormatter: baseColDef.valueFormatter,
    headerValueGetter: (params) =>
      params.columnApi
        .getRowGroupColumns()
        .map((col) => col.getColDef().headerName)
        .concat(baseColDef.headerName)
        .join("/"),
    cellRendererParams,
  };
};
