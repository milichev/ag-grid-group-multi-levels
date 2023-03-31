import classname from "classname";
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

const numericColumn = {
  type: "numericColumn",
  cellClass: "ag-right-aligned-cell",
  headerClass: "ag-right-aligned-cell",
  maxWidth: 200,
  minWidth: 100,
  sortable: true,
  initialWidth: 150,
  filter: "agNumberColumnFilter",
} satisfies SizeGridColDef;

const priceColumnAggFunc: SizeGridAggFunc<number> = (params) =>
  !params.rowNode.group || params.values.length === 0
    ? params.values
    : getRange(params.values);

const priceColumn = {
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
} satisfies SizeGridColDef;

const ttlPriceColumn = {
  ...priceColumn,
  cellClass: [priceColumn.cellClass, "ttl-cell"],
} satisfies SizeGridColDef;

const baseQuantityColumn = {
  ...numericColumn,
  valueFormatter: getRangeFormatter("units"),
} satisfies SizeGridColDef;

const quantityColumn = {
  ...baseQuantityColumn,
  cellClass: (params) =>
    classname(baseQuantityColumn.cellClass, "col-quantity", {
      "cell-disabled": !params.value,
    }),
  headerClass: baseQuantityColumn.headerClass + " col-quantity",
  editable: true,
} satisfies SizeGridColDef;

const ttlQuantityColumn = {
  ...baseQuantityColumn,
  cellClass: [baseQuantityColumn.cellClass, " ttl-cell"],
  aggFunc: "sum",
} satisfies SizeGridColDef;

/** Describe reusable column props */
export const columnTypes: Record<CustomColumnTypes, SizeGridColDef> = {
  priceColumn,
  quantityColumn,
  ttlQuantityColumn,
  ttlPriceColumn,
};
