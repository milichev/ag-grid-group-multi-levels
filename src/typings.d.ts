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

/**
 * Having `F` a single param function, returns the type of the param;
 */
type ParamType<F extends (param: any) => any> = F extends (
  param: infer P
) => any
  ? P
  : never;

/**
 * Having `F` a single param function, returns the `F`, which accepts the param with its property `K` of type `C`.
 */
type CastParamProp<
  F extends (param: any) => any,
  K extends keyof ParamType<F>,
  C
> = F extends (param: infer P) => infer R
  ? P extends object
    ? K extends keyof P
      ? C extends P[K]
        ? (param: CastProp<P, K, C>) => R
        : F
      : F
    : F
  : F;

type Compare<TValue> = (a: TValue, b: TValue) => number;
