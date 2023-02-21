import _ from "lodash";
import fp from "lodash/fp";
import { CellValueChangedEvent } from "ag-grid-community";
import { Compare, GridGroupDataItem, SizeQuantity } from "../../../types";
import { IAggFunc } from "ag-grid-community/dist/lib/entities/colDef";

export function isCellValueChanged(
  params: CellValueChangedEvent<GridGroupDataItem>
) {
  return params.colDef.equals
    ? !params.colDef.equals(params.oldValue, params.newValue)
    : params.oldValue !== params.newValue;
}

const stringComparer: Compare<string> = (a, b) =>
  a.localeCompare(b, undefined, { ignorePunctuation: true });

const dateComparer: Compare<Date> = (a, b) => +a - +b;

const sizeQuantityComparer: Compare<SizeQuantity> = (a, b) =>
  a.quantity - b.quantity;

export const comparers = {
  string: stringComparer,
  date: dateComparer,
  sizeQuantity: sizeQuantityComparer,
} as const;

const join = <T>({
  separator = "; ",
  defaultValue = "",
  compare,
  map,
  unique,
}: {
  separator?: string;
  defaultValue?: string;
  compare?: _.Many<_.ValueIteratee<T>>;
  map?: (value: T) => string;
  unique?: boolean;
} = {}) => {
  const fns: AnyFunction[] = [fp.filter(fp.negate(fp.isNil))];
  if (compare) {
    fns.push(fp.sortBy<T>(compare));
    if (unique) {
      fns.push(fp.sortedUniq);
    }
  } else if (unique) {
    fns.push(fp.uniq);
  }
  if (map) {
    fns.push(fp.map(map));
  }
  fns.push(fp.join(separator));
  const pipe = fp.pipe(fns);

  return (values: T[] | undefined | null) =>
    !(values?.length > 0) ? defaultValue : pipe(values);
};

const sum =
  <T, R extends number = number>({
    defaultValue = null,
    map,
  }: {
    defaultValue?: R;
    map?: (value: T) => number;
  } = {}) =>
  (values: T[]) => {
    if (!(values?.length > 0)) {
      return defaultValue;
    }
    return values.reduce(
      (acc, value) => acc + (map ? map(value) : (value as number)),
      0
    );
  };

export const aggregate = {
  join,
  sum,
} as const;

type Aggregate<TValue, TResult> = (values: TValue[]) => TResult;

export const getAggFunc =
  <TValue = any, TResult = any>({
    agg = aggregate.join(),
  }: {
    agg?: Aggregate<any, any>;
  }): IAggFunc<GridGroupDataItem, TValue> =>
  (params) => {
    if (!params.rowNode.group) {
      return params.values;
    }
    return params.values?.length ? agg(params.values) : "";
  };
