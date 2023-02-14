import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem } from "../../../interfaces";
import { ColumnApi, GridApi } from "ag-grid-community";
import { afterFrame } from "../../../helpers/afterFrame";

const sizeColumnsToFitDeferred = (api: GridApi, columnApi: ColumnApi) =>
  afterFrame(() => {
    columnApi.autoSizeAllColumns();
  });

export const onRowDataUpdated: AgGridReactProps<GridGroupDataItem>["onRowDataUpdated"] =
  (params) => {
    sizeColumnsToFitDeferred(params.api, params.columnApi);
  };
