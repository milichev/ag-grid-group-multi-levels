import React, { FC } from "react";
import { SizeGridCellRendererParams } from "../types";
import { Warehouse } from "../../../data/types";

type Params = CastProp<SizeGridCellRendererParams, "value", Warehouse>;

export const RichSelectCellRenderer: FC<Params> = ({ value }) => <div className="ag-select-editor-item">{value.name}</div>;
