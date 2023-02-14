import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem, Level } from "../../../interfaces";
import { GridContext } from "../../../hooks/useAppContext";
import { getLevelIndex } from "../../../helpers/levels";

export const postProcessPopup: AgGridReactProps<GridGroupDataItem>["postProcessPopup"] =
  (params) => {
    if (params.type !== "columnMenu") {
      return;
    }

    const {
      appContext: { levelItems },
    }: GridContext = params.context;

    const colId = params.column?.getColId() as Level;
    const levelItemIndex = getLevelIndex(levelItems, colId);
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
