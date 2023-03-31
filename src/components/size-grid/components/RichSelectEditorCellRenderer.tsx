import React, { FC } from "react";
import { SizeGridCellRendererParams } from "../types";
import { Warehouse } from "../../../data/types";

// TODO: generalize the value type
type Params = CastProp<SizeGridCellRendererParams, "value", Warehouse>;

/**
 * Implements the renderer of a single list item for `agRichSelectCellEditor`
 */
export const RichSelectEditorCellRenderer: FC<Params> = ({ value }) => (
  <div className="ag-select-editor-item">{value.name}</div>
);
