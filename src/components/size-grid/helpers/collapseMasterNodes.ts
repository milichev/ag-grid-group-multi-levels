import type { SizeGridApi } from "../types";

export const collapseMasterNodes = (api: SizeGridApi) => {
  api.forEachNode((node) => {
    if (node.master && node.expanded) {
      node.setExpanded(false);
    }
  });
};
