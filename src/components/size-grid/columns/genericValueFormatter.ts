import _ from "lodash";
import type { SizeGridColDef, SizeGridValueFormatterFunc } from "../types";

const MAX_AGG_JOIN_COUNT = 5;

export const genericValueFormatter = (
  ownFormatter: SizeGridColDef["valueFormatter"]
): SizeGridValueFormatterFunc => {
  const formatJoin = (values: any[]) =>
    `${values.slice(0, MAX_AGG_JOIN_COUNT).join("; ")}${
      values.length > MAX_AGG_JOIN_COUNT ? ";…" : ""
    }`;

  return (params) =>
    _.isArray(params.value)
      ? formatJoin(params.value)
      : typeof ownFormatter === "function"
      ? ownFormatter(params)
      : params.value;
};
