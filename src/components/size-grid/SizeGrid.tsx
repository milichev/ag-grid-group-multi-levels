import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
import { ColumnApi, GridReadyEvent } from "ag-grid-community";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import mem from "memoize-one";

import { useContainerEvents, useSizeGridContext } from "./hooks";
import type { GridGroupDataItem, SizeGridData } from "../../data/types";
import { ShipmentsMode } from "../../data/types";
import type { SizeGridApi } from "./types";
import { getGridProps } from "./props/getGridProps";
import { prepareItems } from "../../data/prepareItems";
import { collapseMasterNodes } from "./helpers";
import { nuPerf } from "../../helpers/perf";
import { sideBar } from "./props/SideBar";
import { resolveDisplayLevels } from "../../data/levels";

type Props = {
  data: SizeGridData;
};

const getDataToDisplay = (
  data: SizeGridData,
  shipmentsMode: ShipmentsMode,
  isAllDeliveries: boolean
): SizeGridData => {
  const result = prepareItems({
    data,
    isAllDeliveries,
    shipmentsMode,
  });
  if (process.env.NODE_ENV === "development") {
    Object.freeze(Object.seal(result.items));
    Object.freeze(Object.seal(result));
  }
  return result;
};

export const SizeGrid: FC<Props> = ({ data }) => {
  const gridApi = useRef<SizeGridApi>();
  const columnApi = useRef<ColumnApi>();
  const container = useRef<HTMLDivElement>();
  useContainerEvents(container);
  const [getDataToDisplayMemo] = useState(() => mem(getDataToDisplay));
  const sizeGridContext = useSizeGridContext();
  const { shipmentsMode, isAllDeliveries } = sizeGridContext;
  const levels = useMemo(
    () => resolveDisplayLevels(sizeGridContext),
    [sizeGridContext]
  );
  const [prevLevels, setPrevLevels] = useState(levels);

  const onGridReady = useCallback(
    ({ api, columnApi: colApi }: GridReadyEvent) => {
      gridApi.current = api;
      columnApi.current = colApi;
    },
    []
  );

  const dataToDisplay = getDataToDisplayMemo(
    data,
    shipmentsMode,
    isAllDeliveries
  );

  const gridProps = useMemo(() => {
    const result = getGridProps(
      levels,
      dataToDisplay,
      sizeGridContext,
      gridApi.current,
      columnApi.current
    );

    nuPerf.setContext({
      itemsSource: dataToDisplay.items.length,
      itemsGrid: dataToDisplay.items.length,
      itemsTop: result.rowData?.length ?? 0,
    });

    return result;
  }, [levels, dataToDisplay, sizeGridContext]);

  useEffect(() => {
    if (gridApi.current && prevLevels !== levels) {
      collapseMasterNodes(gridApi.current);
      setPrevLevels(levels);
    }
  }, [levels, prevLevels]);

  useEffect(() => {
    sizeGridContext.setPopupParent(container.current);
  }, [sizeGridContext]);

  return (
    <div ref={container} className="grid-container">
      <AgGridReact<GridGroupDataItem>
        {...gridProps}
        sideBar={sideBar}
        popupParent={container.current}
        onGridReady={onGridReady}
      />
    </div>
  );
};
