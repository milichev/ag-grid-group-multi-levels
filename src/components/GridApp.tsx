import React, { useMemo, useState } from "react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { AppContext, AppContextProvider } from "../hooks/useAppContext";
import { ShipmentsMode, LevelItem, Level } from "../types";
import {
  getGridDataPerf as getGridData,
  getShipments,
} from "../helpers/dataSource";
import { nuPerf, wrap } from "../helpers/perf";
import { Grid } from "./size-grid";
import {
  defaultLevels,
  levels as allLevels,
  defaultCounts,
  defaultShipmentsMode,
  defaultIsAllDeliveries,
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
  const [shipmentsMode, setShipmentsMode] = useState(defaultShipmentsMode);
  const [isAllDeliveries, setIsAllDeliveries] = useState(
    defaultIsAllDeliveries
  );
  const [isFlattenSizes, setIsFlattenSizes] = useState(false);

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
    }),
    [levelItems, shipmentsMode, isAllDeliveries, isFlattenSizes]
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
  const gridData = useMemo(() => {
    return getGridData({
      counts: defaultCounts,
      buildOrderShipments,
      shipmentsMode,
      isFlattenSizes,
    });
  }, [buildOrderShipments, shipmentsMode]);

  nuPerf.setContext({
    ...defaultCounts,
    gridMode: shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
  });

  return (
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
  );
};

export const GridAppPerf = wrap(GridApp, "GridApp", false);
