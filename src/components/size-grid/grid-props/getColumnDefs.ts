import _ from "lodash";
import pluralize from "pluralize";
import fp from "lodash/fp";
import { ColDef, ColumnApi, IGroupCellRendererParams } from "ag-grid-community";

import type { SizeGridContext } from "../../../hooks/useSizeGridContext";
import type {
  GridGroupDataItem,
  Level,
  LevelIndices,
  Product,
  SelectableLevel,
} from "../../../data/types";
import { allLevels, emptySizeGroupId } from "../../../constants";
import { getQuantityColumn } from "./getQuantityColumn";
import {
  GridContext,
  SizeGridAggFunc,
  SizeGridCellRendererOptions,
  SizeGridColDef,
  SizeGridGroupCellRendererParams,
  SizeGridValueFormatterFunc,
} from "../types";
import { formatSizes } from "../../../data/resolvers";
import { wrap } from "../../../helpers/perf";
import { resolveCached } from "../../../helpers/simple-cache";
import { GroupColumnInnerRenderer } from "../components/GroupColumnInnerRenderer";

export const defaultColDef: SizeGridColDef = {
  flex: 1,
  minWidth: 100,
  enableValue: true,
  enableRowGroup: false,
  enablePivot: false,
  sortable: true,
  filter: true,
  resizable: true,
};

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
    comparator: (a: GridGroupDataItem, b: GridGroupDataItem, nodeA, nodeB) => {
      const aStart = +(a || 0);
      const bStart = +(b || 0);
      return aStart !== bStart
        ? aStart - bStart
        : +(nodeA.data?.shipment?.endDate || 0) -
            +(nodeB.data?.shipment?.endDate || 0);
    },
    valueFormatter: (params) => params.data?.shipment?.id ?? "",
  },
  sizeGroup: {
    field: "sizeGroup",
    valueFormatter: (params) =>
      params.value === "" ? emptySizeGroupId : params.value,
  },
};

/** Describe columns, which can be grouped, for both grouped and not grouped states */
const selectableCols: Record<SelectableLevel, SizeGridColDef> = {
  product: {
    headerName: "Product",
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
    headerValueGetter: (params) =>
      params.columnApi.getRowGroupColumns().length
        ? "Size Groups"
        : "Size Group",
  },
};

export const levelTotals: SizeGridColDef[] = [
  {
    colId: "totalUnits",
    headerName: "TTL Units",
    type: "ttlQuantityColumn",
    field: "total.units",
    // pinned: "right",
    // lockPinned: true,
  },
  {
    colId: "totalCost",
    headerName: "TTL Cost",
    type: "ttlPriceColumn",
    field: "total.cost",
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
      colId: "sizes",
      headerName: "Sizes",
      valueGetter: (params) =>
        params.data?.product
          ? resolveCached(
              `product-formatted-sizes:${params.data.product.id}`,
              () => formatSizes(params.data.product)
            )
          : undefined,
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

export const getColumnDefs = wrap(
  ({
    levels,
    levelIndex,
    levelIndices,
    product,
    sizeGridContext,
    allProducts,
    columnApi,
  }: {
    levels: Level[];
    levelIndex: number;
    levelIndices: LevelIndices;
    product: Product | null;
    sizeGridContext: SizeGridContext;
    allProducts: Product[];
    columnApi: ColumnApi | null;
  }): SizeGridColDef[] => {
    const level = levels[levelIndex];
    const isRootLevel = levelIndex === 0;
    const isLeafLevel = levelIndex === levels.length - 1;
    const hasSizeGroups =
      levelIndices.sizeGroup < levelIndices.product ||
      !!product?.sizes?.some((s) => !!s.sizeGroup);

    const hasRowGroup =
      !!columnApi?.getColumn(level) &&
      columnApi?.getRowGroupColumns().length > 0;

    /** Leftmost pinned column the grid is grouped by */
    let groupCol: SizeGridColDef = groupCols[level as SelectableLevel];
    if (groupCol && (level !== "sizeGroup" || hasSizeGroups)) {
      // TODO: pick only required
      const cellRendererParams = {
        fullWidth: false,
        suppressCount: true,
        // suppressDoubleClickExpand: false,
        // suppressEnterExpand: false,
        suppressPadding: true,
        checkbox: isRootLevel,
        innerRenderer: GroupColumnInnerRenderer,
        innerRendererParams: {} satisfies SizeGridCellRendererOptions,
      } satisfies Partial<SizeGridGroupCellRendererParams>;
      groupCol = {
        colId: level,
        ...groupCol,
        ...selectableCols[level],
        cellRenderer: !isLeafLevel ? "agGroupCellRenderer" : undefined,
        cellClass: !isLeafLevel ? "ag-group-cell" : undefined,
        cellRendererParams,
        pinned: "left",
        lockPinned: true,
        hide: hasRowGroup,
        lockVisible: true,
        suppressSizeToFit: true,
        headerComponent: undefined,
        headerCheckboxSelection: isRootLevel,
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

    /** If it's a product level, an array of the groupable columns that don't have their group levels */
    const nonGroup =
      level === "product"
        ? allLevels
            .filter(
              (l) =>
                l !== level &&
                l !== "sizeGroup" &&
                levelIndices[l] === undefined
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
      (isLeafLevel &&
        ((sizeGridContext.isFlattenSizes
          ? [
              ...allProducts
                .reduce((acc, prd) => {
                  prd.sizes.forEach((size) => {
                    if (!acc.has(size.id)) {
                      const col = getQuantityColumn({
                        size,
                        product: prd,
                        hasSizeGroups: false,
                        levelIndices,
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
                  levelIndices,
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

    return [
      groupCol,
      ...nonGroup,
      ...auxCols,
      ...sizeCols,
      ...levelTotals,
    ].filter(Boolean);
  },
  "getColumnDefs",
  false
);

export const getAutoGroupColumnDef = (level: Level): SizeGridColDef => {
  const baseColDef: SizeGridColDef = {
    ...(groupCols[level] || {}),
    ...(selectableCols[level] || {}),
  };

  const cellRendererParams: IGroupCellRendererParams<GridGroupDataItem> = {
    footerValueGetter: (params) => {
      const { levels, levelIndex }: GridContext = params.context;
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
    cellRendererParams,
  };
};
