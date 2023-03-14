import { GridApi } from "ag-grid-community";
import { GridGroupDataItem } from "../../../data/types";

export const refreshExpanded = (api: GridApi<GridGroupDataItem>) => {
  api.forEachNode((node) => {
    if (node.master && node.expanded) {
      node.setExpanded(false);
    }
  });
};
