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
import {
  ColumnApi,
  GridApi,
  GridReadyEvent,
  SideBarDef,
} from "ag-grid-community";

import { useSizeGridContext } from "../../hooks/useSizeGridContext";
import {
  GridDataItem,
  GridGroupDataItem,
  Level,
  Shipment,
} from "../../data/types";
import { getGridProps } from "./grid-props/getGridProps";
import { LevelsToolPanel } from "../LevelsToolPanel";
import { nuPerf } from "../../helpers/perf";
import { prepareItems } from "../../data/prepareItems";
import { ToolPanelColumnCompParams } from "ag-grid-community/dist/lib/interfaces/iToolPanel";
import { refreshExpanded } from "./helpers/refreshExpanded";

const sideBar: SideBarDef = {
  toolPanels: [
    {
      id: "columns",
      labelDefault: "Columns",
      labelKey: "columns",
      iconKey: "columns",
      toolPanel: "agColumnsToolPanel",
      minWidth: 225,
      maxWidth: 225,
      width: 225,
      toolPanelParams: {
        suppressValues: true,
        suppressPivots: true,
      } as ToolPanelColumnCompParams,
    },
    {
      id: "filters",
      labelDefault: "Filters",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
      minWidth: 180,
      maxWidth: 400,
      width: 250,
    },
    {
      id: "nestingLevels",
      labelDefault: "Nesting Levels",
      labelKey: "nestingLevels",
      iconKey: "linked",
      minWidth: 180,
      maxWidth: 400,
      width: 250,
      toolPanel: LevelsToolPanel,
    },
  ],
  defaultToolPanel: "nestingLevels",
};

type Props = {
  levels: Level[];
  items: GridDataItem[];
  buildOrderShipments: Shipment[];
};

export const Grid: React.FC<Props> = memo(
  ({ levels, items, buildOrderShipments }: Props) => {
    const [prevLevels, setPrevLevels] = useState(levels);
    const gridApi = useRef<GridApi>();
    const columnApi = useRef<ColumnApi>();
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
        gridApi.current,
        columnApi.current
      );
      nuPerf.setContext({
        itemsSource: items.length,
        itemsGrid: itemsToDisplay.length,
        itemsTop: result.rowData?.length ?? 0,
      });
      return result;
    }, [levels, itemsToDisplay, sizeGridContext, items.length]);

    useEffect(() => {
      if (gridApi.current && prevLevels !== levels) {
        refreshExpanded(gridApi.current);
        setPrevLevels(levels);
      }
    }, [levels, prevLevels]);

    return (
      <AgGridReact<GridGroupDataItem>
        {...gridProps}
        sideBar={sideBar}
        onGridReady={onGridReady}
      />
    );
  }
);
