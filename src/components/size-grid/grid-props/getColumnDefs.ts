import _ from "lodash";
import fp from "lodash/fp";
import { ColDef, ColumnApi, GroupCellRendererParams } from "ag-grid-community";

import type { AppContext } from "../../../hooks/useAppContext";
import type {
  GridGroupDataItem,
  Level,
  Product,
  SelectableLevel,
  VisibleLevels,
} from "../../../types";
import { allLevels } from "../../../constants";
import { getQuantityColumn } from "./getQuantityColumn";
import {
  SizeGridAggFunc,
  SizeGridColDef,
  SizeGridValueFormatterFunc,
} from "../types";

const MAX_AGG_JOIN_COUNT = 5;

const aggUnique = fp.pipe([
  fp.filter(fp.negate(fp.isNil)),
  fp.flatten,
  fp.sortBy(_.identity),
  fp.sortedUniq,
]);

const genericAggFunc: SizeGridAggFunc<number> = (params) =>
  aggUnique(params.values);

const genericValueFormatter = (
  ownFormatter: SizeGridColDef["valueFormatter"]
): SizeGridValueFormatterFunc => {
  const formatJoin = (values: any[]) =>
    `${values.slice(0, MAX_AGG_JOIN_COUNT).join("; ")}${
      values.length > MAX_AGG_JOIN_COUNT ? ";…" : ""
    }`;

  return (params) =>
    _.isArray(params.value)
      ? formatJoin(params.value)
      : typeof ownFormatter === "function"
      ? ownFormatter(params)
      : params.value;
};

/** Describe columns, which can be grouped, as not grouped ColDefs */
const groupCols: Record<SelectableLevel, SizeGridColDef> = {
  product: {
    // field: 'product.name',
    valueGetter: (params) =>
      params.node.group
        ? ""
        : `${params.data?.product?.name}${
            params.data?.product?.sizes?.some((s) => !!s.sizeGroup) ? " *" : ""
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
const selectableCols: Record<SelectableLevel, SizeGridColDef> = {
  product: {
    headerName: "Product Name",
    filter: "agTextColumnFilter",
    minWidth: 140,
    initialWidth: 160,
    sortable: true,
  },
  warehouse: {
    headerName: "Warehouse",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 150,
    headerValueGetter: (params) =>
      params.columnApi.getRowGroupColumns().length ? "Warehouses" : "Warehouse",
  },
  shipment: {
    headerName: "Shipment",
    filter: "agSetColumnFilter",
    sortable: true,
    minWidth: 220,
    initialWidth: 220,
    headerValueGetter: (params) =>
      params.columnApi.getRowGroupColumns().length ? "Shipments" : "Shipment",
  },
  sizeGroup: {
    headerName: "Size Group",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 200,
  },
};

const levelTotals: SizeGridColDef[] = [
  {
    headerName: "TTL Units",
    field: "ttlUnits",
    type: "ttlQuantityColumn",
    // pinned: "right",
    // lockPinned: true,
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

const levelAuxCols: Partial<Record<SelectableLevel, SizeGridColDef[]>> = {
  product: [
    {
      headerName: "Department",
      field: "product.department",
      enableRowGroup: true,
      minWidth: 100,
      sortable: true,
    },
    {
      headerName: "Gender",
      field: "product.gender",
      enableRowGroup: true,
      minWidth: 100,
      sortable: true,
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
  appContext,
  allProducts,
  columnApi,
}: {
  levels: Level[];
  levelIndex: number;
  visibleLevels: VisibleLevels;
  product: Product | null;
  appContext: AppContext;
  allProducts: Product[];
  columnApi: ColumnApi | null;
}): SizeGridColDef[] => {
  const level = levels[levelIndex];
  const hasSizeGroups = !!product?.sizes?.some((s) => !!s.sizeGroup);

  const hasRowGroup =
    !!columnApi?.getColumn(level) && columnApi?.getRowGroupColumns().length > 0;

  /** Leftmost pinned column the grid is grouped by */
  let groupCol: SizeGridColDef = groupCols[level as SelectableLevel];
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
      cellRenderer:
        levelIndex < levels.length - 1 ? "agGroupCellRenderer" : undefined,
      cellRendererParams,
      pinned: "left",
      lockPinned: true,
      hide: hasRowGroup,
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
          ? params.node.groupData?.["ag-Grid-AutoColumn"]
          : valueGetter(params);
    }

    groupCol.minWidth && (groupCol.minWidth += 60);
  }

  /** If it's a top level, an array of the groupable columns that are not added to grouping */
  const nonGroup =
    levelIndex === 0
      ? allLevels
          .filter(
            (l) =>
              l !== level && l !== "sizeGroup" && visibleLevels[l] === undefined
          )
          .map((l): ColDef => {
            const result: ColDef = {
              colId: l,
              ...groupCols[l],
              ...selectableCols[l],
              pinned: null,
              maxWidth: 200,
              lockPinned: false,
              lockVisible: false,
              enableRowGroup: true,
              suppressSizeToFit: false,
            };
            return {
              ...result,
              aggFunc: genericAggFunc,
              valueFormatter: genericValueFormatter(result.valueFormatter),
            };
          })
      : [];

  /** Quantity columns are visible only at the innermost level when a product is available,
   * OR when sizes are flattened to the product level. */
  const sizeCols =
    (levelIndex === levels.length - 1 &&
      ((appContext.isFlattenSizes
        ? [
            ...allProducts
              .reduce((acc, prd) => {
                prd.sizes.forEach((size) => {
                  if (!acc.has(size.id)) {
                    const col = getQuantityColumn({
                      size,
                      product: prd,
                      hasSizeGroups: false,
                      visibleLevels,
                    });
                    acc.set(col.colId, col);
                  }
                });
                return acc;
              }, new Map<string, SizeGridColDef>())
              .values(),
          ]
        : product?.sizes
            .map((size) =>
              getQuantityColumn({
                size,
                product,
                hasSizeGroups,
                visibleLevels,
              })
            )
            .filter((col) => !!col)) as SizeGridColDef[])) ||
    [];

  const auxCols = (levelAuxCols[level] || []).map((col): SizeGridColDef => {
    const colId = col.colId || col.field?.split(".").at(-1);
    return {
      colId,
      ...col,
      aggFunc: col.enableRowGroup ? genericAggFunc : undefined,
      valueFormatter: col.enableRowGroup
        ? genericValueFormatter(col.valueFormatter)
        : undefined,
    };
  });

  return [groupCol, ...nonGroup, ...auxCols, ...sizeCols, ...levelTotals];
};

export const getAutoGroupColumnDef = (level: Level): SizeGridColDef => {
  const baseColDef: SizeGridColDef | undefined = {
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
