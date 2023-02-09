import React, { useCallback, useContext, useMemo, createContext } from "react";
import { Level, GridGroupDataItem, NestLevelItem } from "./interfaces";

const levelsContext = createContext({
  levelItems: [] as NestLevelItem[],
  setLevelItems: (items: NestLevelItem[]) => undefined
});

export const LevelsContextProvider = levelsContext.Provider;

export const useAppContext = () => useContext(levelsContext);
