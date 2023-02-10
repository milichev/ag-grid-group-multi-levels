import { useContext, createContext } from "react";
import { NestLevelItem } from "./interfaces";

interface ContextValues {
  levelItems: NestLevelItem[];
  isBuildOrder: boolean;
}

type ContextValueSetters = {
  [K in keyof ContextValues as `set${Capitalize<K>}`]: (
    value: ContextValues[K]
  ) => void;
};

type Context = ContextValues & ContextValueSetters;

const levelsContext = createContext({
  levelItems: [],
  isBuildOrder: true,
} as Context);

export const LevelsContextProvider = levelsContext.Provider;

export const useAppContext = () => useContext(levelsContext);
