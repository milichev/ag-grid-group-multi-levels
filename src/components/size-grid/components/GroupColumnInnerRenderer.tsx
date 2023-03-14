import React, { FC } from "react";
import { SizeGridCellRendererParams } from "../types";

export type GroupColumnInnerRendererProps = SizeGridCellRendererParams;

export const GroupColumnInnerRenderer: FC<GroupColumnInnerRendererProps> = ({
  value,
  data,
  formatValue,
  valueFormatted,
}) => {
  const label = valueFormatted ?? formatValue(value);
  return (
    <div className="ag-group-cell-inner">
      <span className="ag-group-cell-label">{label}</span>
      <span
        className="ag-group-cell-menu-button ag-icon ag-icon-menu"
        role="presentation"
        data-item-id={data?.id}
      />
    </div>
  );
};
