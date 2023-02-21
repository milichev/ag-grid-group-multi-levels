import { IAggFuncParams } from "ag-grid-community";
import { GridGroupDataItem } from "../../../types";
import { getRange, range, formats } from "../../../helpers/conversion";
import { ValueFormatterFunc } from "ag-grid-community/dist/lib/entities/colDef";
import { SizeGridColDef } from "../types";

type CustomColumnTypes =
  | "priceColumn"
  | "quantityColumn"
  | "ttlPriceColumn"
  | "ttlQuantityColumn";

const getRangeFormatter =
  (type: keyof typeof range): ValueFormatterFunc<GridGroupDataItem> =>
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

const priceColumn: SizeGridColDef = {
  ...numericColumn,
  aggFunc: (params: IAggFuncParams<GridGroupDataItem, number>) =>
    !params.rowNode.group || params.values.length === 0
      ? params.values
      : getRange(params.values),
  valueFormatter: getRangeFormatter("money"),
};

const ttlPriceColumn: SizeGridColDef = {
  ...priceColumn,
  cellClass: priceColumn.cellClass + " ttl-cell",
};

const baseQuantityColumn: SizeGridColDef = {
  ...numericColumn,
  // valueFormatter: getRangeFormatter("units"),
};

const quantityColumn: SizeGridColDef = {
  ...baseQuantityColumn,
  // cellClass: baseQuantityColumn.cellClass + " col-quantity",
  cellClass: (params) =>
    `${baseQuantityColumn.cellClass} col-quantity ${
      params.value ? "" : "cell-disabled"
    }`,
  headerClass: baseQuantityColumn.headerClass + " col-quantity",
  editable: true,
  valueFormatter: (params) => {
    return formats.units.format(params.value);
  },
};

const ttlQuantityColumn: SizeGridColDef = {
  ...baseQuantityColumn,
  cellClass: baseQuantityColumn.cellClass + " ttl-cell",
  aggFunc: "sum",
  valueFormatter: (params) => {
    return formats.units.format(params.value);
  },
};

/** Describe reusable column props */
export const columnTypes: Record<CustomColumnTypes, SizeGridColDef> = {
  priceColumn,
  quantityColumn,
  ttlQuantityColumn,
  ttlPriceColumn,
};
