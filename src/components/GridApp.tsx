import React, { StrictMode, useMemo, useReducer } from "react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {
  type SizeGridContext,
  SizeGridContextAction,
  SizeGridContextProvider,
} from "../hooks/useSizeGridContext";
import { getFake } from "../data/getFake";
import { nuPerf, wrap } from "../helpers/perf";
import { Grid } from "./size-grid";
import { defaultCounts, defaultLevels, defaultSettings } from "../constants";
import { fixupLevelItems, resolveDisplayLevels } from "../data/levels";
import { gaEvents } from "../helpers/ga";
import { SizeGridSettings } from "./size-grid/types";

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
  return ctx[prop] === payload
    ? ctx
    : {
        ...ctx,
        [prop]: payload,
      };
};

const initSizeGridReducer = (initial: SizeGridSettings) => ({
  ...initial,
  levelItems: fixupLevelItems({
    ...initial,
    levelItems: initial.levelItems.slice(),
  }),
});

const GridApp: React.FC = () => {
  const [contextValues, dispatch] = useReducer(
    sizeGridSettingsReducer,
    {
      ...defaultSettings,
      levelItems: defaultLevels,
    },
    initSizeGridReducer
  );

  const sizeGridContext = useMemo<SizeGridContext>(
    () => ({
      ...contextValues,
      dispatch,
    }),
    [contextValues]
  );

  const {
    isLimitedSizes,
    isUseSizeGroups,
    shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
  } = sizeGridContext;

  const levels = useMemo(
    () => resolveDisplayLevels(sizeGridContext),
    [sizeGridContext]
  );

  const buildOrderShipments = useMemo(
    () => getFake.shipments(defaultCounts.buildOrderShipments),
    []
  );

  // get fake grid order data
  const gridData = useMemo(
    () =>
      getFake.gridData({
        counts: defaultCounts,
        buildOrderShipments,
        shipmentsMode,
        isLimitedSizes,
        isUseSizeGroups,
      }),
    [buildOrderShipments, isLimitedSizes, isUseSizeGroups, shipmentsMode]
  );

  nuPerf.setContext({
    ...defaultCounts,
    gridMode: shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
  });

  return (
    <StrictMode>
      <div style={styles.container}>
        <div style={styles.grid} className="ag-theme-alpine">
          <SizeGridContextProvider value={sizeGridContext}>
            <Grid
              items={gridData}
              levels={levels}
              buildOrderShipments={buildOrderShipments}
            />
          </SizeGridContextProvider>
        </div>
      </div>
    </StrictMode>
  );
};

export const GridAppPerf = wrap(GridApp, "GridApp", false);
