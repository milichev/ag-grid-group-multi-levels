import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColumnApi, GridReadyEvent } from "ag-grid-community";

import { useContainerEvents, useSizeGridContext } from "./hooks";
import type {
  GridDataItem,
  GridGroupDataItem,
  Level,
  Shipment,
} from "../../data/types";
import type { SizeGridApi } from "./types";
import { getGridProps } from "./props/getGridProps";
import { prepareItems } from "../../data/prepareItems";
import { collapseMasterNodes } from "./helpers";
import { nuPerf } from "../../helpers/perf";
import { sideBar } from "./props/SideBar";

type Props = {
  levels: Level[];
  items: GridDataItem[];
  buildOrderShipments: Shipment[];
};

export const SizeGrid: React.FC<Props> = memo(
  ({ levels, items, buildOrderShipments }: Props) => {
    const [prevLevels, setPrevLevels] = useState(levels);
    const gridApi = useRef<SizeGridApi>();
    const columnApi = useRef<ColumnApi>();
    const container = useContainerEvents();
    const sizeGridContext = useSizeGridContext();
    const { shipmentsMode, isAllDeliveries } = sizeGridContext;

    const onGridReady = useCallback((params: GridReadyEvent) => {
      gridApi.current = params.api;
      columnApi.current = params.columnApi;
    }, []);

    const itemsToDisplay = useMemo(
      () =>
        prepareItems({
          shipmentsMode,
          isAllDeliveries,
          items,
          buildOrderShipments,
        }),
      [shipmentsMode, isAllDeliveries, items, buildOrderShipments]
    );

    const gridProps = useMemo(() => {
      const result = getGridProps(
        levels,
        itemsToDisplay,
        sizeGridContext,
        container.current,
        gridApi.current,
        columnApi.current
      );

      nuPerf.setContext({
        itemsSource: items.length,
        itemsGrid: itemsToDisplay.length,
        itemsTop: result.rowData?.length ?? 0,
      });

      return result;
    }, [levels, itemsToDisplay, sizeGridContext, container, items.length]);

    useEffect(() => {
      if (gridApi.current && prevLevels !== levels) {
        collapseMasterNodes(gridApi.current);
        setPrevLevels(levels);
      }
    }, [levels, prevLevels]);

    return (
      <div ref={container} className="grid-container">
        <AgGridReact<GridGroupDataItem>
          {...gridProps}
          popupParent={container.current}
          sideBar={sideBar}
          onGridReady={onGridReady}
        />
      </div>
    );
  }
);
