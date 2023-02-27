import React, { StrictMode, useMemo, useState } from "react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { type AppContext, AppContextProvider } from "../hooks/useAppContext";
import { ShipmentsMode } from "../data/types";
import { getFake } from "../data/getFake";
import { nuPerf, wrap } from "../helpers/perf";
import { Grid } from "./size-grid";
import { defaultCounts, defaultLevels, defaultSettings } from "../constants";
import { fixupLevelItems, resolveDisplayLevels } from "../data/levels";

const styles = {
  container: { width: "100%", height: "100%" },
  grid: { height: "100%", width: "100%" },
};

const GridApp: React.FC = () => {
  const [shipmentsMode, setShipmentsMode] = useState(
    defaultSettings.shipmentsMode
  );
  const [isAllDeliveries, setIsAllDeliveries] = useState(
    defaultSettings.isAllDeliveries
  );
  const [isFlattenSizes, setIsFlattenSizes] = useState(
    defaultSettings.isFlattenSizes
  );
  const [isLimitedSizes, setIsLimitedSizes] = useState(
    defaultSettings.isLimitedSizes
  );
  const [isUseSizeGroups, setIsUseSizeGroups] = useState(
    defaultSettings.isUseSizeGroups
  );
  const [levelItems, setLevelItems] = useState(() =>
    fixupLevelItems({
      shipmentsMode,
      levelItems: [...defaultLevels],
      isFlattenSizes,
    })
  );

  const appContext = useMemo<AppContext>(
    () => ({
      levelItems,
      setLevelItems,
      shipmentsMode,
      setShipmentsMode,
      isAllDeliveries:
        isAllDeliveries || shipmentsMode === ShipmentsMode.BuildOrder,
      setIsAllDeliveries,
      isFlattenSizes,
      setIsFlattenSizes,
      isLimitedSizes,
      setIsLimitedSizes,
      isUseSizeGroups,
      setIsUseSizeGroups,
    }),
    [
      levelItems,
      shipmentsMode,
      isAllDeliveries,
      isFlattenSizes,
      isLimitedSizes,
      isUseSizeGroups,
    ]
  );

  const levels = useMemo(() => resolveDisplayLevels(appContext), [appContext]);

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
          <AppContextProvider value={appContext}>
            <Grid
              items={gridData}
              levels={levels}
              buildOrderShipments={buildOrderShipments}
            />
          </AppContextProvider>
        </div>
      </div>
    </StrictMode>
  );
};

export const GridAppPerf = wrap(GridApp, "GridApp", false);
