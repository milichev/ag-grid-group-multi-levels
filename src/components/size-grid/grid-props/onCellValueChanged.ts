import { RowNode } from "ag-grid-community";
import { TotalInfo } from "../../../data/types";
import { measureStep } from "../../../helpers/perf";
import {
  GridContext,
  SizeGridApi,
  SizeGridProps,
  SizeGridRowNode,
} from "../types";
import { isCellValueChanged } from "./helpers";
import { collectProductTotals } from "../../../data/totals";
import { levelTotals } from "./getColumnDefs";

export const onCellValueChanged: SizeGridProps["onCellValueChanged"] = (
  params
) => {
  const step = measureStep({ name: "onCellValueChanged", async: false });
  if (params.colDef.type === "quantityColumn" && isCellValueChanged(params)) {
    refreshTtlCells(params.node, params.api, params.context);
  }
  step.finish();
};

const refreshColIds = levelTotals.map((col) => col.colId);

const refreshTtlCells = (
  node: SizeGridRowNode,
  api: SizeGridApi,
  context: GridContext
) => {
  let { data: item } = node;
  if (item.sizes) {
    item = {
      ...item,
      total: collectProductTotals(item, item.product, item.sizeGroup),
    };
  } else {
    const detailApi: SizeGridApi = api.getDetailGridInfo(
      `detail_${item.id}`
    ).api;
    const total: TotalInfo = {
      units: 0,
      cost: 0,
    };
    detailApi.forEachNode((detailNode) => {
      total.units += detailNode.data.total.units;
      total.cost += detailNode.data.total.cost;
    });
    item = {
      ...item,
      total,
    };
  }

  node.setData(item);

  // the cell content is already updated with setData, but we need to forcefully refresh cells to make them flash on update.
  api.refreshCells({
    rowNodes: [node as RowNode],
    columns: refreshColIds,
    force: true,
  });

  // traverse to the master grid, if any
  const { master }: GridContext = context;
  if (master) {
    const masterNode = master.api.getRowNode(master.id);
    refreshTtlCells(masterNode, master.api, master.context);
  }
};
