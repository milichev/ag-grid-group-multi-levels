import { ValueFormatterParams } from "ag-grid-community/dist/lib/entities/colDef";
import type {
  GridGroupDataItem,
  Product,
  SelectableLevel,
  Warehouse,
} from "../../../data/types";
import type { SizeGridColDef } from "../types";
import { emptySizeGroupId } from "../../../constants";
import { resolveCached } from "../../../helpers/simple-cache";
import { formatSizes } from "../../../data/resolvers";

/** Describe columns, which can be grouped, as not grouped ColDefs */
export const groupCols: Record<SelectableLevel, SizeGridColDef> = {
  product: {
    // field: "product",
    valueGetter: (params) => params.data?.product,
    valueFormatter: (
      params: CastProp<ValueFormatterParams, "value", Product>
    ) =>
      params.node.group
        ? ""
        : `${params.value?.name}${
            params.value?.sizes?.some((s) => !!s.sizeGroup) ? " *" : ""
          }`,
  },
  warehouse: {
    field: "warehouse",
    valueGetter: (params) => params.data?.warehouse,
    valueFormatter: (
      params: CastProp<ValueFormatterParams, "value", Warehouse>
    ) => params.value?.name,
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
export const selectableCols: Record<SelectableLevel, SizeGridColDef> = {
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
    minWidth: 110,
    initialWidth: 150,
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

export const levelAuxCols: Partial<Record<SelectableLevel, SizeGridColDef[]>> =
  {
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
