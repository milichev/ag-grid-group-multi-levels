import _ from "lodash";
import fp from "lodash/fp";
import { ColDef, ColumnApi } from "ag-grid-community";

import type {
  Level,
  LevelIndices,
  Product,
  SelectableLevel,
} from "../../../data/types";
import { allLevels } from "../../../constants";
import { getQuantityColumn } from "./getQuantityColumn";
import {
  SizeGridAggFunc,
  SizeGridCellRendererOptions,
  SizeGridColDef,
  SizeGridContext,
  SizeGridGroupCellRendererParams,
} from "../types";
import { wrap } from "../../../helpers/perf";
import { GroupColumnInnerRenderer } from "../components";
import { genericValueFormatter } from "./genericValueFormatter";
import {
  groupCols,
  levelAuxCols,
  levelTotals,
  selectableCols,
} from "./col-defs";

const aggUnique = fp.pipe([
  fp.filter(fp.negate(fp.isNil)),
  fp.flatten,
  fp.sortBy(_.identity),
  fp.sortedUniq,
]);

const genericAggFunc: SizeGridAggFunc<number> = (params) =>
  aggUnique(params.values);

export const getColDefs = wrap(
  ({
    levels,
    levelIndex,
    levelIndices,
    product,
    sizeGridContext,
    allProducts,
    columnApi,
  }: {
    levels: Level[];
    levelIndex: number;
    levelIndices: LevelIndices;
    product: Product | null;
    sizeGridContext: SizeGridContext;
    allProducts: Product[];
    columnApi: ColumnApi | null;
  }): SizeGridColDef[] => {
    const level = levels[levelIndex];
    const isRootLevel = levelIndex === 0;
    const isLeafLevel = levelIndex === levels.length - 1;
    const hasSizeGroups =
      levelIndices.sizeGroup < levelIndices.product ||
      !!product?.sizes?.some((s) => !!s.sizeGroup);

    const hasRowGroup =
      !!columnApi?.getColumn(level) &&
      columnApi?.getRowGroupColumns().length > 0;

    /** Leftmost pinned column the grid is grouped by */
    let groupCol: SizeGridColDef = groupCols[level as SelectableLevel];
    if (groupCol && (level !== "sizeGroup" || hasSizeGroups)) {
      // TODO: pick only required
      const cellRendererParams = {
        fullWidth: false,
        suppressCount: true,
        // suppressDoubleClickExpand: false,
        // suppressEnterExpand: false,
        suppressPadding: true,
        checkbox: isRootLevel,
        innerRenderer: GroupColumnInnerRenderer,
        innerRendererParams: {} satisfies SizeGridCellRendererOptions,
      } satisfies Partial<SizeGridGroupCellRendererParams>;
      groupCol = {
        colId: level,
        ...groupCol,
        ...selectableCols[level],
        cellRenderer: !isLeafLevel ? "agGroupCellRenderer" : undefined,
        cellClass: !isLeafLevel ? "ag-group-cell" : undefined,
        cellRendererParams,
        pinned: "left",
        lockPinned: true,
        hide: hasRowGroup,
        lockVisible: true,
        suppressSizeToFit: true,
        headerComponent: undefined,
        headerCheckboxSelection: isRootLevel,
      };

      // if the grid is grouped, get the group auto-column value
      const { valueGetter } = groupCol;
      if (typeof valueGetter === "function") {
        groupCol.valueGetter = (params) =>
          params.node.group
            ? params.node.groupData?.["ag-Grid-AutoColumn"]
            : valueGetter(params);
      }

      groupCol.minWidth && (groupCol.minWidth += 60);
    }

    /** If it's a product level, an array of the groupable columns that don't have their group levels */
    const nonGroup =
      level === "product"
        ? allLevels
            .filter(
              (l) =>
                l !== level &&
                l !== "sizeGroup" &&
                levelIndices[l] === undefined
            )
            .map((l): ColDef => {
              const result: ColDef = {
                colId: l,
                ...groupCols[l],
                ...selectableCols[l],
                pinned: null,
                maxWidth: 200,
                lockPinned: false,
                lockVisible: false,
                enableRowGroup: true,
                suppressSizeToFit: false,
              };
              return {
                ...result,
                aggFunc: genericAggFunc,
                valueFormatter: genericValueFormatter(result.valueFormatter),
              };
            })
        : [];

    /** Quantity columns are visible only at the innermost level when a product is available,
     * OR when sizes are flattened to the product level. */
    const sizeCols =
      (isLeafLevel &&
        ((sizeGridContext.isFlattenSizes
          ? [
              ...allProducts
                .reduce((acc, prd) => {
                  prd.sizes.forEach((size) => {
                    if (!acc.has(size.id)) {
                      const col = getQuantityColumn({
                        size,
                        product: prd,
                        hasSizeGroups: false,
                        levelIndices,
                      });
                      acc.set(col.colId, col);
                    }
                  });
                  return acc;
                }, new Map<string, SizeGridColDef>())
                .values(),
            ]
          : product?.sizes
              .map((size) =>
                getQuantityColumn({
                  size,
                  product,
                  hasSizeGroups,
                  levelIndices,
                })
              )
              .filter((col) => !!col)) as SizeGridColDef[])) ||
      [];

    const auxCols = (levelAuxCols[level] || []).map((col): SizeGridColDef => {
      const colId = col.colId || col.field?.split(".").at(-1);
      return {
        colId,
        ...col,
        aggFunc: col.enableRowGroup ? genericAggFunc : undefined,
        valueFormatter: col.enableRowGroup
          ? genericValueFormatter(col.valueFormatter)
          : undefined,
      };
    });

    return [
      groupCol,
      ...nonGroup,
      ...auxCols,
      ...sizeCols,
      ...levelTotals,
    ].filter(Boolean);
  },
  "getColDefs",
  false
);
