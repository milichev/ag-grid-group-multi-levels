import { ColDef, IAggFuncParams } from "ag-grid-community";
import { GridGroupDataItem } from "../../../types";
import { getRange, range } from "../../../helpers/conversion";
import { ValueFormatterFunc } from "ag-grid-community/dist/lib/entities/colDef";

type CustomColumnTypes =
  | "priceColumn"
  | "quantityColumn"
  | "ttlPriceColumn"
  | "ttlQuantityColumn";

const getAggValueFormatter =
  (type: keyof typeof range): ValueFormatterFunc<GridGroupDataItem> =>
  (params) =>
    range[type](params.value);

const numericColumn: ColDef<GridGroupDataItem> = {
  type: "numericColumn",
  cellClass: "ag-right-aligned-cell",
  headerClass: "ag-right-aligned-cell",
  maxWidth: 200,
  minWidth: 100,
  sortable: true,
  initialWidth: 150,
  filter: "agNumberColumnFilter",
};

const priceColumn: ColDef<GridGroupDataItem> = {
  ...numericColumn,
  aggFunc: (params: IAggFuncParams<GridGroupDataItem, number>) =>
    !params.rowNode.leafGroup || params.values.length === 0
      ? params.values
      : getRange(params.values),
  valueFormatter: getAggValueFormatter("money"),
};

const ttlPriceColumn: ColDef<GridGroupDataItem> = {
  ...priceColumn,
  cellClass: priceColumn.cellClass + " ttl-cell",
};

const baseQuantityColumn: ColDef<GridGroupDataItem> = {
  ...numericColumn,
  valueFormatter: getAggValueFormatter("units"),
};

const quantityColumn: ColDef<GridGroupDataItem> = {
  ...baseQuantityColumn,
  // cellClass: baseQuantityColumn.cellClass + " col-quantity",
  cellClass: (params) =>
    `${baseQuantityColumn.cellClass} col-quantity ${
      params.value ? "" : "cell-disabled"
    }`,
  headerClass: baseQuantityColumn.headerClass + " col-quantity",
  editable: true,
};

const ttlQuantityColumn: ColDef<GridGroupDataItem> = {
  ...baseQuantityColumn,
  cellClass: baseQuantityColumn.cellClass + " ttl-cell",
  aggFunc: "sum",
};

/** Describe reusable column props */
export const columnTypes: Record<
  CustomColumnTypes,
  ColDef<GridGroupDataItem>
> = {
  priceColumn,
  quantityColumn,
  ttlQuantityColumn,
  ttlPriceColumn,
};
