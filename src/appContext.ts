import { useContext, createContext } from "react";
import { Level, LevelItem } from "./interfaces";

interface ContextValues {
  levelItems: LevelItem[];
  isBuildOrder: boolean;
}

type ContextValueSetters = {
  [K in keyof ContextValues as `set${Capitalize<K>}`]: (
    value: ContextValues[K]
  ) => void;
};

export type AppContext = ContextValues & ContextValueSetters;

const appContext = createContext({
  levelItems: [],
  isBuildOrder: true,
} as AppContext);

export const AppContextProvider = appContext.Provider;

export const useAppContext = () => useContext(appContext);

export interface GridContext {
  levels: Level[];
  levelIndex: number;
  appContext: AppContext;
}
