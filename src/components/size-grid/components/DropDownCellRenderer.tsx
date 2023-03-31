import React, { FC } from "react";
import { SizeGridCellRendererParams } from "../types";
import { DropdownLookalike } from "./DropdownLookalike";

type Params = SizeGridCellRendererParams;

export const DropDownCellRenderer: FC<Params> = ({
  value,
  valueFormatted,
  formatValue,
}) => <DropdownLookalike text={valueFormatted ?? formatValue(value)} />;
