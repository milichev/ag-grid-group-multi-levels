import { GridDataItem, Level, LevelIndices } from "../../../data/types";
import { SizeGridContext } from "../../../hooks/useSizeGridContext";
import { GridContext, SizeGridGetDetailCellRendererParams } from "../types";
import { measureAction, wrap } from "../../../helpers/perf";
import { collectEntities } from "../../../data/resolvers";
import { getAutoGroupColumnDef, getColumnDefs } from "./getColumnDefs";
import { groupItems } from "../../../data/groupItems";
import { getLevelIndices } from "../../../data/levels";
import { commonGridProps } from "./commonGridProps";

export const getDetailRendererParams = (
  gridData: GridDataItem[],
  levels: Level[],
  levelIndex: number,
  levelIndices: LevelIndices,
  sizeGridContext: SizeGridContext,
  popupParent: HTMLElement | null,
  masterContext: GridContext
) => {
  const level = levels[levelIndex];
  if (!level) return undefined;

  const detailCellRendererParams: SizeGridGetDetailCellRendererParams = (
    params
  ) => {
    const item = params.data;

    const product =
      levelIndices.product < levelIndex ? item.group[0].product : null;
    const hasSizeGroups = product?.sizes?.some((s) => !!s.sizeGroup);

    // level info for the currently expanded parent item
    let currentLevel = level;
    let localLevels = levels;
    let localLevelIndices = levelIndices;

    // remove unneeded sizeGroup nested level, if any
    if (product && !hasSizeGroups) {
      if (levelIndices.sizeGroup >= levelIndex) {
        localLevels = levels.slice();
        localLevels.splice(levelIndices.sizeGroup, 1);
        currentLevel = localLevels[levelIndex];
        if (
          localLevels.length === levelIndex &&
          !sizeGridContext.isFlattenSizes
        ) {
          localLevels.push("sizes");
        }
        localLevelIndices = getLevelIndices(localLevels);
      }
    }

    const context: GridContext = {
      levels: localLevels,
      levelIndex,
      sizeGridContext,
      master: {
        id: params.data.id,
        api: params.api,
        columnApi: params.columnApi,
        context: masterContext,
      },
    };

    const detailCellRendererParams = getDetailRendererParams(
      gridData,
      localLevels,
      levelIndex + 1,
      localLevelIndices,
      sizeGridContext,
      popupParent,
      context
    );

    const allProducts = measureAction(
      () =>
        sizeGridContext.isFlattenSizes
          ? [...collectEntities(item.group).products.values()]
          : [],
      "collectEntities"
    );

    const columnDefs = getColumnDefs({
      levels: localLevels,
      levelIndex,
      levelIndices: localLevelIndices,
      product,
      sizeGridContext,
      allProducts,
      columnApi: null,
    });

    const { items } = groupItems(
      item.group,
      localLevels,
      levelIndex,
      localLevelIndices,
      item
    );

    return {
      detailGridOptions: {
        ...commonGridProps,
        autoGroupColumnDef: getAutoGroupColumnDef(currentLevel),
        columnDefs,
        context,
        masterDetail: !!detailCellRendererParams,
        detailCellRendererParams,
        popupParent,
      },
      getDetailRowData: (params) => {
        params.successCallback(items);
      },
    };
  };

  return wrap(
    detailCellRendererParams,
    `detailCellRendererParams:${level}`,
    false
  );
};
