import { ColDef, GroupCellRendererParams } from "ag-grid-community";

import type { AppContext } from "../../../hooks/useAppContext";
import type {
  GridGroupDataItem,
  Level,
  Product,
  SelectableLevel,
  VisibleLevels,
} from "../../../interfaces";
import { levels as allLevels } from "../../../constants";
import { joinUnique } from "../../../helpers/conversion";
import { getQuantityColumn } from "./getQuantityColumn";
import { collectSizesTotals } from "../../../helpers/groupItems";

/** Describe columns, which can be grouped, as not grouped ColDefs */
const groupCols: Record<SelectableLevel, ColDef<GridGroupDataItem>> = {
  product: {
    // field: 'product.name',
    valueGetter: ({ data }) =>
      `${data.product?.name}${
        data.product?.sizes?.some((s) => !!s.sizeGroup) ? " *" : ""
      }`,
  },
  warehouse: {
    field: "warehouse.name",
  },
  shipment: {
    field: "shipment.startDate",
    filterParams: {
      suppressAndOrCondition: true,
    },
    valueFormatter: (params) => params.data?.shipment?.id ?? "",
  },
  sizeGroup: {
    field: "sizeGroup",
  },
};

/** Describe columns, which can be grouped, for both grouped and not grouped states */
const selectableCols: Record<SelectableLevel, ColDef<GridGroupDataItem>> = {
  product: {
    headerName: "Product Name",
    filter: "agTextColumnFilter",
    minWidth: 140,
    initialWidth: 160,
    // maxWidth: 200,
    sortable: true,
  },
  warehouse: {
    headerName: "Warehouse",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 150,
  },
  shipment: {
    headerName: "Shipment",
    filter: "agSetColumnFilter",
    sortable: true,
    minWidth: 220,
    initialWidth: 220,
  },
  sizeGroup: {
    headerName: "Size Group",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 200,
  },
};

const levelTotals: ColDef<GridGroupDataItem>[] = [
  {
    headerName: "TTL Units",
    field: "ttlUnits",
    type: "ttlQuantityColumn",
    // pinned: "right",
    // lockPinned: true,
    // valueGetter: (params) => {
    //   return collectSizesTotals(params.data).ttlUnits;
    // },
  },
  {
    headerName: "TTL Cost",
    field: "ttlCost",
    type: "ttlPriceColumn",
    aggFunc: "sum",
    // pinned: "right",
    // lockPinned: true,
  },
];

const levelAuxCols: Partial<
  Record<SelectableLevel, ColDef<GridGroupDataItem>[]>
> = {
  product: [
    {
      headerName: "Department",
      field: "product.department",
      enableRowGroup: true,
      minWidth: 100,
      sortable: true,
      // valueFormatter: ({ value }) => `Dept: ${value}`,
    },
    {
      headerName: "Gender",
      field: "product.gender",
      enableRowGroup: true,
      minWidth: 100,
      sortable: true,
      // valueFormatter: ({ value }) => (value ? `Gender: ${value}` : ""),
    },
    {
      headerName: "Cost",
      field: "product.wholesale",
      type: "priceColumn",
    },
    {
      headerName: "Retail",
      field: "product.retail",
      type: "priceColumn",
    },
  ],
  warehouse: [
    {
      headerName: "Code",
      field: "warehouse.code",
      enableRowGroup: true,
      minWidth: 100,
      initialWidth: 100,
      sortable: true,
    },
    {
      headerName: "Country",
      field: "warehouse.country",
      enableRowGroup: true,
      minWidth: 121,
      initialWidth: 121,
      sortable: true,
    },
    {
      headerName: "Postal Code",
      field: "warehouse.zip",
      enableRowGroup: true,
      minWidth: 121,
      initialWidth: 121,
      sortable: true,
    },
  ],
};

const getAggFunc = (col: ColDef) => {
  const comparer: (a: any, b: any) => number =
    col.colId === "shipment"
      ? (a: Date, b: Date) => +a - +b
      : (a: string, b: string) =>
          a.localeCompare(b, undefined, { ignorePunctuation: true });
  return (params) => {
    if (!params.rowNode.group) {
      return params.values;
    }
    return params.values?.length
      ? joinUnique(params.values, "; ", comparer)
      : "";
  };
};

export const getColumnDefs: typeof getColumnDefsArray = (...args) => {
  // noinspection UnnecessaryLocalVariableJS
  const cols = getColumnDefsArray(...args).filter(Boolean);
  // console.log('columnDefs', cols);
  return cols;
};

export const getColumnDefsArray = ({
  levels,
  levelIndex,
  visibleLevels,
  product,
}: {
  levels: Level[];
  levelIndex: number;
  visibleLevels: VisibleLevels;
  product: Product | null;
  appContext: AppContext;
}): ColDef<GridGroupDataItem>[] => {
  const level = levels[levelIndex];
  const hasSizeGroups = !!product?.sizes?.some((s) => !!s.sizeGroup);

  /** Leftmost pinned column the grid is grouped by */
  let groupCol: ColDef<GridGroupDataItem> = groupCols[level as SelectableLevel];
  if (groupCol && (level !== "sizeGroup" || hasSizeGroups)) {
    // TODO: pick only required
    const cellRendererParams: Partial<
      GroupCellRendererParams<GridGroupDataItem>
    > = {
      fullWidth: false,
      suppressCount: false,
      // suppressDoubleClickExpand: false,
      // suppressEnterExpand: false,
      suppressPadding: true,
      checkbox: levelIndex === 0,
      // innerRendererSelector: () => ({
      //   component: GroupInnerRenderer,
      //   params: {},
      // }),
    };
    groupCol = {
      colId: level,
      ...groupCol,
      ...selectableCols[level],
      cellRenderer: "agGroupCellRenderer",
      cellRendererParams,
      pinned: "left",
      lockPinned: true,
      lockVisible: true,
      suppressSizeToFit: true,
      headerComponent: undefined,
      headerCheckboxSelection: levelIndex === 0,
    };

    // if the grid is grouped, get the group auto-column value
    const { valueGetter } = groupCol;
    if (typeof valueGetter === "function") {
      groupCol.valueGetter = (params) =>
        params.node.group
          ? params.node.groupData["ag-Grid-AutoColumn"]
          : valueGetter(params);
    }

    // if the grid is grouped, use the group auto column formatter, when possible
    /*
    const { valueFormatter } = groupCol;
    if (typeof valueFormatter === "function") {
      //    : params.value;
      groupCol.valueFormatter = (params) => {
        if (!params.node.group) {
          return valueFormatter(params);
        }

        const { valueFormatter: autoGroupValueFormatter } =
          params.node.rowGroupColumn.getColDef();
        return typeof autoGroupValueFormatter === "function"
          ? autoGroupValueFormatter(params)
          : params.value;
      };
    }
*/

    groupCol.minWidth && (groupCol.minWidth += 60);
  }

  /** If it's a top level, an array of the groupable columns that are not added to grouping */
  const nonGroup =
    levelIndex === 0
      ? allLevels
          .filter((l) => l !== level && l !== "sizeGroup" && !visibleLevels[l])
          .map((l): ColDef => {
            const result: ColDef = {
              colId: l,
              ...groupCols[l],
              ...selectableCols[l],
              enableRowGroup: true,
            };
            return {
              ...result,
              aggFunc: getAggFunc(result),
            };
          })
      : [];

  /** Quantity columns are visible only at the innermost level when a product is available */
  const sizeCols =
    ((levelIndex === levels.length - 1 &&
      product?.sizes
        .map((size) =>
          getQuantityColumn({
            size,
            product,
            hasSizeGroups,
            visibleLevels,
          })
        )
        .filter((col) => !!col)) as ColDef<GridGroupDataItem>[]) || [];

  const auxCols = (levelAuxCols[level] || []).map((col) =>
    col.enableRowGroup
      ? {
          ...col,
          aggFunc: getAggFunc(col),
        }
      : col
  );

  return [groupCol, ...nonGroup, ...auxCols, ...sizeCols, ...levelTotals];
};

export const getAutoGroupColumnDef = (
  level: Level
): ColDef<GridGroupDataItem> => {
  const baseColDef: ColDef<GridGroupDataItem> | undefined = {
    ...(groupCols[level] || {}),
    ...(selectableCols[level] || {}),
  };

  return {
    minWidth: 200,
    cellRenderer: "agGroupCellRenderer",
    field: baseColDef.field,
    valueGetter: baseColDef.valueGetter,
    headerValueGetter: (params) =>
      params.columnApi
        .getRowGroupColumns()
        .map((col) => col.getColDef().headerName)
        .concat(baseColDef.headerName)
        .join("/"),
  };
};
