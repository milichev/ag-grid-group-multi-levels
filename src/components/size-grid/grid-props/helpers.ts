import { CellValueChangedEvent } from "ag-grid-community";
import { WithSizeGridEntities } from "../types";

export function isCellValueChanged(
  params: WithSizeGridEntities<CellValueChangedEvent>
) {
  return params.colDef.equals
    ? !params.colDef.equals(params.oldValue, params.newValue)
    : params.oldValue !== params.newValue;
}
