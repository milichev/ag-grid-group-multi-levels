import { createContext, useContext } from "react";
import { ShipmentsMode, Level, LevelItem, Shipment } from "../interfaces";

interface ContextValues {
  levelItems: LevelItem[];
  shipmentsMode: ShipmentsMode;
  isAllDeliveries: boolean;
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
} as AppContext);

export const AppContextProvider = appContext.Provider;

export const useAppContext = () => useContext(appContext);

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  appContext: AppContext;
}
