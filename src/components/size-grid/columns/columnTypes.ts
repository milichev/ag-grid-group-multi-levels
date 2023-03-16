import { getRange, range } from "../../../helpers/formatting";
import {
  SizeGridAggFunc,
  SizeGridColDef,
  SizeGridValueFormatterFunc,
} from "../types";

type CustomColumnTypes =
  | "priceColumn"
  | "quantityColumn"
  | "ttlPriceColumn"
  | "ttlQuantityColumn";

const getRangeFormatter =
  (type: keyof typeof range): SizeGridValueFormatterFunc =>
  (params) =>
    range[type](params.value);

const numericColumn: SizeGridColDef = {
  type: "numericColumn",
  cellClass: "ag-right-aligned-cell",
  headerClass: "ag-right-aligned-cell",
  maxWidth: 200,
  minWidth: 100,
  sortable: true,
  initialWidth: 150,
  filter: "agNumberColumnFilter",
};

const priceColumnAggFunc: SizeGridAggFunc<number> = (params) =>
  !params.rowNode.group || params.values.length === 0
    ? params.values
    : getRange(params.values);

const priceColumn: SizeGridColDef = {
  ...numericColumn,
  aggFunc: priceColumnAggFunc,
  comparator: (a: number | [number, number], b: number | [number, number]) =>
    Array.isArray(a)
      ? Array.isArray(b)
        ? a[0] === b[0]
          ? a[1] - b[1]
          : a[0] - b[0]
        : a[0] - b
      : a - (Array.isArray(b) ? b[0] : b),
  valueFormatter: getRangeFormatter("money"),
};

const ttlPriceColumn: SizeGridColDef = {
  ...priceColumn,
  cellClass: priceColumn.cellClass + " ttl-cell",
};

const baseQuantityColumn: SizeGridColDef = {
  ...numericColumn,
  valueFormatter: getRangeFormatter("units"),
};

const quantityColumn: SizeGridColDef = {
  ...baseQuantityColumn,
  cellClass: (params) =>
    `${baseQuantityColumn.cellClass} col-quantity ${
      params.value ? "" : "cell-disabled"
    }`,
  headerClass: baseQuantityColumn.headerClass + " col-quantity",
  editable: true,
};

const ttlQuantityColumn: SizeGridColDef = {
  ...baseQuantityColumn,
  cellClass: baseQuantityColumn.cellClass + " ttl-cell",
  aggFunc: "sum",
};

/** Describe reusable column props */
export const columnTypes: Record<CustomColumnTypes, SizeGridColDef> = {
  priceColumn,
  quantityColumn,
  ttlQuantityColumn,
  ttlPriceColumn,
};
