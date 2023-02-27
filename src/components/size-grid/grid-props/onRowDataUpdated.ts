import { ColumnApi, GridApi } from "ag-grid-community";
import { afterFrame } from "../../../helpers/afterFrame";
import { SizeGridProps } from "../types";

const sizeColumnsToFitDeferred = (api: GridApi, columnApi: ColumnApi) =>
  afterFrame(() => {
    columnApi.autoSizeAllColumns();
  });

export const onRowDataUpdated: SizeGridProps["onRowDataUpdated"] = (params) => {
  sizeColumnsToFitDeferred(params.api, params.columnApi);
};
