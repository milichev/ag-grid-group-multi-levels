import { createContext, Dispatch, useContext } from "react";
import { defaultSettings } from "../constants";
import type { SizeGridSettings } from "../components/size-grid/types";

export type PropAction<T, K extends keyof T> = {
  prop: K;
  payload: T[K];
};

export type SizeGridContextAction = PropAction<
  SizeGridSettings,
  keyof SizeGridSettings
>;

export type SizeGridContext = SizeGridSettings & {
  dispatch: Dispatch<SizeGridContextAction>;
};

const sizeGridContext = createContext<SizeGridContext>({
  ...defaultSettings,
  levelItems: [],
} as SizeGridContext);

export const SizeGridContextProvider = sizeGridContext.Provider;

export const useSizeGridContext = () => useContext(sizeGridContext);
