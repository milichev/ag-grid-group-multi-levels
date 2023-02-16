import { GridGroupDataItem, Level } from "../../types";
import { ColumnApi, GridApi } from "ag-grid-community";
import { AppContext } from "../../hooks/useAppContext";

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  appContext: AppContext;
  master: null | {
    id: string;
    api: GridApi<GridGroupDataItem>;
    columnApi: ColumnApi;
    context: GridContext;
  };
}
