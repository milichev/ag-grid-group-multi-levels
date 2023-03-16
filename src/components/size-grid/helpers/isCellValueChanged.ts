import { WithSizeGridEntities } from "../types";
import { CellValueChangedEvent } from "ag-grid-community";
import { GridGroupDataItem } from "../../../data/types";

export function isCellValueChanged(
  params: WithSizeGridEntities<CellValueChangedEvent<GridGroupDataItem>>
) {
  return params.colDef.equals
    ? !params.colDef.equals(params.oldValue, params.newValue)
    : params.oldValue !== params.newValue;
}
