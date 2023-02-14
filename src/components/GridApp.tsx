import React, { useMemo, useState } from "react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { AppContext, AppContextProvider } from "../hooks/useAppContext";
import { ShipmentsMode, LevelItem } from "../interfaces";
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

  const appContext = useMemo<AppContext>(
    () => ({
      levelItems,
      setLevelItems,
      shipmentsMode,
      setShipmentsMode,
      isAllDeliveries:
        isAllDeliveries || shipmentsMode === ShipmentsMode.BuildOrder,
      setIsAllDeliveries,
    }),
    [levelItems, shipmentsMode, isAllDeliveries]
  );

  const levels = useMemo(() => {
    const result = levelItems
      .filter((item) => item.visible)
      .map((item) => item.level);
    if (result.at(-1) === "product") {
      result.push("sizes");
    }
    return result;
  }, [levelItems]);

  const buildOrderShipments = useMemo(
    () => getShipments(defaultCounts.buildOrderShipments),
    []
  );

  // get fake grid order data
  const gridData = useMemo(() => {
    return getGridData({
      counts: defaultCounts,
      buildOrderShipments,
      shipmentsMode: shipmentsMode,
    });
  }, [buildOrderShipments, shipmentsMode]);

  nuPerf.setContext({
    ...defaultCounts,
    gridMode: shipmentsMode,
    isAllDeliveries,
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
