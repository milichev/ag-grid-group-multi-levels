import { createContext, useContext } from "react";
import { LevelItem, ShipmentsMode } from "../types";

interface ContextValues {
  levelItems: LevelItem[];
  shipmentsMode: ShipmentsMode;
  isAllDeliveries: boolean;
  isFlattenSizes: boolean;
  isLimitedSizes: boolean;
}

type ContextValueSetters = {
  [K in keyof ContextValues as `set${Capitalize<K>}`]: (
    value: ContextValues[K]
  ) => void;
};

export type AppContext = ContextValues & ContextValueSetters;

const appContext = createContext<AppContext>({
  levelItems: [],
  shipmentsMode: ShipmentsMode.BuildOrder,
  isAllDeliveries: false,
  isFlattenSizes: false,
  isLimitedSizes: false,
} as AppContext);

export const AppContextProvider = appContext.Provider;

export const useAppContext = () => useContext(appContext);
