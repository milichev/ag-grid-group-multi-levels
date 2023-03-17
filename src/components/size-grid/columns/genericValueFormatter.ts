import _ from "lodash";
import type { SizeGridColDef, SizeGridValueFormatterFunc } from "../types";
import { ValueFormatterParams } from "ag-grid-community";
import { GridGroupDataItem } from "../../../data/types";

const MAX_AGG_JOIN_COUNT = 5;

export const genericValueFormatter = (
  ownFormatter: SizeGridColDef["valueFormatter"]
): SizeGridValueFormatterFunc => {
  const fmt =
    typeof ownFormatter === "function"
      ? ownFormatter
      : (params) => params.value;

  const formatJoin = (
    params: CastProp<ValueFormatterParams<GridGroupDataItem>, "value", any[]>
  ) =>
    `${params.value
      .slice(0, MAX_AGG_JOIN_COUNT)
      .map((el) =>
        fmt({
          ...params,
          value: el,
        })
      )
      .join("; ")}${params.value.length > MAX_AGG_JOIN_COUNT ? ";…" : ""}`;

  return (params) => _.isArray(params.value) ? formatJoin(params) : fmt(params);
};
