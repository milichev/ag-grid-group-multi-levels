/// <reference types="react-scripts" />
// noinspection JSUnusedGlobalSymbols

declare module "react/jsx-runtime" {
  export default any;
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type AnyFunction = (...args: any[]) => any;

type Methods<T> = Pick<
  T,
  { [K in keyof T]: T[K] extends AnyFunction ? K : never }[keyof T]
>;

/**
 * Makes the prop `K` in `T` of type `C`.
 */
type CastProp<T extends object, K extends keyof T, C> = {
  [P in keyof T]: P extends K ? C : T[P];
};

type Compare<TValue> = (a: TValue, b: TValue) => number;
