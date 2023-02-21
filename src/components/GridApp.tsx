import React, { StrictMode, useMemo, useState } from "react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { AppContext, AppContextProvider } from "../hooks/useAppContext";
import { Level, LevelItem, ShipmentsMode } from "../types";
import {
  getGridDataPerf as getGridData,
  getShipments,
} from "../helpers/dataSource";
import { nuPerf, wrap } from "../helpers/perf";
import { Grid } from "./size-grid";
import {
  defaultCounts,
  defaultLevels,
  defaultSettings,
  allLevels,
} from "../constants";
import { isLevel } from "../helpers/levels";

const styles = {
  container: { width: "100%", height: "100%" },
  grid: { height: "100%", width: "100%" },
};

const GridApp: React.FC = () => {
  const [levelItems, setLevelItems] = useState(
    allLevels.map(
      (level): LevelItem => ({
        level,
        visible: defaultLevels.includes(level),
      })
    )
  );
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

  const levels = useMemo(() => {
    const result: Level[] = levelItems
      .filter(
        (item) =>
          item.visible &&
          (!isFlattenSizes ||
            isLevel(item.level, "product", "warehouse", "shipment"))
      )
      .map((item) => item.level);

    if (!isFlattenSizes && result.at(-1) === "product") {
      result.push("sizes");
    }

    return result;
  }, [isFlattenSizes, levelItems]);

  const buildOrderShipments = useMemo(
    () => getShipments(defaultCounts.buildOrderShipments),
    []
  );

  // get fake grid order data
  const gridData = useMemo(
    () =>
      getGridData({
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
