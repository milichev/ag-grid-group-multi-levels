import React, { FC } from "react";

type Props = { text: string };

export const DropdownLookalike: FC<Props> = ({ text }) => (
  <div className="dropdown-lookalike">
    <span className="dropdown-lookalike-label">{text}</span>
    <span className="ag-icon ag-icon-tree-closed" role="presentation" />
  </div>
);
