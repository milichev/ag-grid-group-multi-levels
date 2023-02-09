import { useContext, createContext } from "react";
import { NestLevelItem } from "./interfaces";

type SetLevelItems = (items: NestLevelItem[]) => void;

const levelsContext = createContext({
  levelItems: [] as NestLevelItem[],
  setLevelItems: (() => undefined) as SetLevelItems,
});

export const LevelsContextProvider = levelsContext.Provider;

export const useAppContext = () => useContext(levelsContext);
