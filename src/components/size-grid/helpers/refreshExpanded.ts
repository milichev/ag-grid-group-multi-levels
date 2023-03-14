import type { SizeGridApi } from "../types";

export const refreshExpanded = (api: SizeGridApi) => {
  api.forEachNode((node) => {
    if (node.master && node.expanded) {
      node.setExpanded(false);
    }
  });
};
