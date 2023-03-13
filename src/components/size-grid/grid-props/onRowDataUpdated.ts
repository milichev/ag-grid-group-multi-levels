import { ColumnApi, GridApi } from "ag-grid-community";
import { afterFrame } from "../../../helpers/afterFrame";
import { SizeGridEventHandler } from "../types";

const sizeColumnsToFitDeferred = (api: GridApi, columnApi: ColumnApi) =>
  afterFrame(() => {
    columnApi.autoSizeAllColumns();
  });

export const onRowDataUpdated: SizeGridEventHandler<"onRowDataUpdated"> = (
  params
) => {
  // sizeColumnsToFitDeferred(params.api, params.columnApi);
};
