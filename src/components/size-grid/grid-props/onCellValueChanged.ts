import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem } from "../../../types";
import { collectSizesTotals } from "../../../helpers/groupItems";
import { IRowNode } from "ag-grid-community/dist/lib/interfaces/iRowNode";
import { GridApi } from "ag-grid-community";
import { measureStep } from "../../../helpers/perf";
import { GridContext, SizeGridProps } from "../types";
import { isCellValueChanged } from "./helpers";

export const onCellValueChanged: SizeGridProps["onCellValueChanged"] = (
  params
) => {
  const step = measureStep({ name: "onCellValueChanged", async: false });
  if (params.colDef.type === "quantityColumn" && isCellValueChanged(params)) {
    refreshTtlCells(params.node, params.api, params.context);
  }
  step.finish();
};

const refreshTtlCells = (
  node: IRowNode<GridGroupDataItem>,
  api: GridApi<GridGroupDataItem>,
  context: GridContext
) => {
  let { data: item } = node;
  if (item.sizes) {
    item = {
      ...item,
      ...collectSizesTotals(item, item.product),
    };
  } else {
    const detailApi: GridApi<GridGroupDataItem> = api.getDetailGridInfo(
      `detail_${item.id}`
    ).api;
    const acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost"> = {
      ttlUnits: 0,
      ttlCost: 0,
    };
    detailApi.forEachNode((detailNode) => {
      acc.ttlUnits += detailNode.data.ttlUnits;
      acc.ttlCost += detailNode.data.ttlCost;
    });
    item = {
      ...item,
      ...acc,
    };
  }

  node.setData(item);

  // the cell content is already updated with setData, but we need to forcefully refresh cells to make them flash on update.
  api.refreshCells({
    rowNodes: [node],
    columns: ["ttlUnits", "ttlCost"],
    force: true,
  });

  // traverse to the master grid, if any
  const { master }: GridContext = context;
  if (master) {
    const masterNode = master.api.getRowNode(master.id);
    refreshTtlCells(masterNode, master.api, master.context);
  }
};
