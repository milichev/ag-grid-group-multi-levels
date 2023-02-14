import _ from "lodash";

/** Numeric cell formatters */
export const formats = {
  units: Intl.NumberFormat("en", { maximumFractionDigits: 0 }),
  money: Intl.NumberFormat("en", { style: "currency", currency: "USD" }),
} as const;

type RangeFormatter = (value: number | [number, number] | number[][]) => string;
export const range = Object.entries(formats).reduce(
  (acc, [name, format]: [keyof typeof formats, Intl.NumberFormat]) => {
    const rangeFormatter: RangeFormatter = (value) => {
      if (typeof value === "number") {
        return format.format(value);
      }
      if (Array.isArray(value)) {
        const first = value[0];
        const second = value[1];
        if (
          value.length === 2 &&
          typeof first === "number" &&
          typeof second === "number"
        ) {
          return first === second
            ? rangeFormatter(first)
            : format.formatRange(
                first < second ? first : second,
                first > second ? first : second
              );
        }
        return rangeFormatter(getRange(_.flatten(value)));
      }
      return "";
    };
    acc[name] = rangeFormatter;
    return acc;
  },
  {} as Record<keyof typeof formats, RangeFormatter>
);

export const getRange = (values: number[]): [number, number] =>
  values.reduce(
    ([min, max], val) => {
      if (val < min) min = val;
      if (val > max) max = val;
      return [min, max];
    },
    [Number.MAX_VALUE, Number.MIN_VALUE]
  );

export const joinUnique = <T>(
  values: T[],
  separator = "; ",
  comparer?: (a: T, b: T) => number
): string => [...new Set(values)].sort(comparer).join(separator);

export const toQuantity = (val: string | number): number | undefined =>
  typeof val === "string" && /^\d+$/.test(val)
    ? Number.parseInt(val)
    : typeof val === "number" && !Number.isNaN(val)
    ? val
    : undefined;
