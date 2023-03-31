import React, { StrictMode, useMemo, useReducer, useState } from "react";
import mem from "memoize-one";

import type {
  SizeGridContext,
  SizeGridContextAction,
  SizeGridSettings,
} from "./size-grid/types";
import { SizeGrid, SizeGridContextProvider } from "./size-grid";
import { getFake } from "../data/getFake";
import { nuPerf, wrap } from "../helpers/perf";
import { defaultCounts, defaultLevels, defaultSettings } from "../constants";
import { fixupLevelItems } from "../data/levels";
import { gaEvents } from "../helpers/ga";
import { ShipmentsMode } from "../data/types";
import { SmallViewportWarning } from "./SmallViewportWarning";

const styles = {
  container: { width: "100%", height: "100%" },
  grid: { height: "100%", width: "100%" },
};

const sizeGridSettingsReducer = (
  ctx: SizeGridSettings,
  { prop, payload }: SizeGridContextAction
) => {
  if (prop !== "levelItems") {
    gaEvents.appSettings(prop, payload);
  }
  const result =
    ctx[prop] === payload
      ? ctx
      : {
          ...ctx,
          [prop]: payload,
        };
  if (process.env.NODE_ENV === "development") {
    console.log("sizeGridSettings", prop, payload, result);
  }
  return result;
};

const initSizeGridReducer = (initial: SizeGridSettings) => ({
  ...initial,
  levelItems: fixupLevelItems({
    ...initial,
    levelItems: initial.levelItems.slice(),
  }),
});

const createGridData = (
  isLimitedSizes: boolean,
  isUseSizeGroups: boolean,
  shipmentsMode: ShipmentsMode
) =>
  getFake.gridData({
    counts: defaultCounts,
    isLimitedSizes,
    isUseSizeGroups,
    shipmentsMode,
  });

export const GridApp: React.FC = () => {
  const [contextValues, dispatch] = useReducer(
    sizeGridSettingsReducer,
    {
      ...defaultSettings,
      levelItems: defaultLevels,
    },
    initSizeGridReducer
  );
  const [createGridDataMemo] = useState(() => mem(createGridData));

  const sizeGridContext = useMemo((): SizeGridContext => {
    let popupParent: HTMLElement;
    return {
      ...contextValues,
      getPopupParent: () => popupParent,
      setPopupParent: (element) => (popupParent = element),
      dispatch,
    };
  }, [contextValues]);

  const {
    isLimitedSizes,
    isUseSizeGroups,
    shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
  } = sizeGridContext;

  // get fake grid order data
  const gridData = createGridDataMemo(
    isLimitedSizes,
    isUseSizeGroups,
    shipmentsMode
  );

  nuPerf.setContext({
    ...defaultCounts,
    shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
  });

  return (
    <StrictMode>
      <div style={styles.container}>
        <div style={styles.grid} className="ag-theme-alpine">
          <SizeGridContextProvider value={sizeGridContext}>
            <SizeGrid data={gridData} />
            <SmallViewportWarning />
          </SizeGridContextProvider>
        </div>
      </div>
    </StrictMode>
  );
};

export const GridAppPerf = wrap(GridApp, "GridApp", false);
