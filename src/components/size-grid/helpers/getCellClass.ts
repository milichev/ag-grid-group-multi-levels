import classname from "classname";
import _ from "lodash";
import { SizeGridColDef } from "../types";

export const getCellClass = (
  baseCellClass: SizeGridColDef["cellClass"],
  ...rest: Parameters<typeof classname>
): SizeGridColDef["cellClass"] =>
  _.isFunction(baseCellClass)
    ? (params) => classname(baseCellClass(params), ...rest)
    : classname(baseCellClass, ...rest);
