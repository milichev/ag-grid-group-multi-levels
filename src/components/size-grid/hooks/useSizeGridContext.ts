import { createContext, useContext } from "react";
import { defaultSettings } from "../../../constants";
import type { SizeGridContext } from "../types";

const sizeGridContext = createContext<SizeGridContext>({
  ...defaultSettings,
  levelItems: [],
} as SizeGridContext);

export const SizeGridContextProvider = sizeGridContext.Provider;

export const useSizeGridContext = () => useContext(sizeGridContext);
