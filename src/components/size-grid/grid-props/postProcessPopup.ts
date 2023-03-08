import { Level } from "../../../data/types";
import { getLevelItemIndex } from "../../../data/levels";
import { GridContext, SizeGridProps } from "../types";

export const postProcessPopup: SizeGridProps["postProcessPopup"] = (params) => {
  if (params.type !== "columnMenu") {
    return;
  }

  const {
    sizeGridContext: { levelItems },
  }: GridContext = params.context;

  const colId = params.column?.getColId() as Level;
  const levelItemIndex = getLevelItemIndex(levelItems, colId);
  if (levelItemIndex >= 0) {
    const ePopup = params.ePopup;
    let oldTopStr = ePopup.style.top!;
    // remove 'px' from the string (AG Grid uses px positioning)
    oldTopStr = oldTopStr.substring(0, oldTopStr.indexOf("px"));
    const oldTop = parseInt(oldTopStr);
    const newTop = oldTop + 25;
    ePopup.style.top = newTop + "px";
  }
};
