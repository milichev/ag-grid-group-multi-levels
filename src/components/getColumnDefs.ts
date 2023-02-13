import {
  ColDef,
  ValueGetterParams,
  ValueSetterParams,
} from "ag-grid-community";

import type { AppContext } from "../hooks/useAppContext";
import {
  Product,
  Level,
  levels as allLevels,
  VisibleLevels,
  Size,
  SelectableLevel,
  GridGroupDataItem,
  SizeQuantity,
} from "../interfaces";
import { formats, getSizeKey } from "../helpers/format";

/** Describe columns, which can be grouped, as not grouped ColDefs */
const groupCols: Record<SelectableLevel, ColDef<GridGroupDataItem>> = {
  product: {
    // field: 'product.name',
    valueGetter: (params: ValueGetterParams) => {
      const item = params.data as GridGroupDataItem;
      return `${item.product?.name}${
        item.product?.sizes?.some((s) => !!s.sizeGroup) ? " *" : ""
      }`;
    },
  },
  warehouse: {
    field: "warehouse.name",
  },
  shipment: {
    field: "shipment.startDate",
    filterParams: {
      suppressAndOrCondition: true,
    },
    valueFormatter: (params) => params.data?.shipment?.id ?? "",
  },
  sizeGroup: {
    field: "sizeGroup",
  },
};

/** Describe columns, which can be grouped, for both grouped and not grouped states */
const selectableCols: Record<SelectableLevel, ColDef<GridGroupDataItem>> = {
  product: {
    headerName: "Product Name",
    filter: "agTextColumnFilter",
    minWidth: 140,
    initialWidth: 160,
    sortable: true,
  },
  warehouse: {
    headerName: "Warehouse",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 150,
  },
  shipment: {
    headerName: "Shipment",
    filter: "agSetColumnFilter",
    sortable: true,
    minWidth: 220,
    initialWidth: 220,
  },
  sizeGroup: {
    headerName: "Size Group",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 200,
  },
};

type CustomColumnTypes = "priceColumn" | "quantityColumn";

/** Describe reusabe column props */
export const columnTypes: Record<
  CustomColumnTypes,
  ColDef<GridGroupDataItem>
> = {
  priceColumn: {
    type: "numericColumn",
    maxWidth: 200,
    minWidth: 150,
    initialWidth: 170,
    filter: "agNumberColumnFilter",
    valueFormatter: (params) => formats.money.format(params.value),
  },
  quantityColumn: {
    minWidth: 100,
    maxWidth: 100,
    cellClass: "col-quantity",
    headerClass: "col-quantity",
    initialWidth: 100,
    editable: true,
    sortable: true,
    type: "numericColumn",
    valueFormatter: (params) => formats.units.format(params.value),
  },
};

const levelTotals: ColDef<GridGroupDataItem>[] = [
  {
    headerName: "TTL Units",
    field: "ttlUnits",
    type: "numericColumn",
    // need to repeat internal class ag-right-aligned-cell bc it is overwritten by cellClass
    cellClass: "ttl-cell ag-right-aligned-cell",
    minWidth: 100,
    maxWidth: 150,
    initialWidth: 100,
    sortable: true,
    // pinned: "right",
    // lockPinned: true,
    valueFormatter: (params) => formats.units.format(params.value),
  },
  {
    headerName: "TTL Cost",
    field: "ttlCost",
    type: "numericColumn",
    cellClass: "ttl-cell ag-right-aligned-cell",
    minWidth: 100,
    maxWidth: 150,
    initialWidth: 100,
    sortable: true,
    // pinned: "right",
    // lockPinned: true,
    valueFormatter: (params) => formats.money.format(params.value),
  },
];

const toQuantity = (val: string | number): number | undefined =>
  typeof val === "string" && /^\d+$/.test(val)
    ? Number.parseInt(val)
    : typeof val === "number" && !Number.isNaN(val)
    ? val
    : undefined;

type QuantitySetParams = CastProp<
  ValueSetterParams<GridGroupDataItem>,
  "newValue",
  SizeQuantity
>;
const getQuantityColumn = ({
  size,
  product,
  visibleLevels,
  hasSizeGroups,
}: {
  size: Size;
  visibleLevels: VisibleLevels;
  product: Product;
  hasSizeGroups: boolean;
}): ColDef<GridGroupDataItem> | undefined => {
  if (!visibleLevels.sizeGroup || !hasSizeGroups) {
    return {
      type: "quantityColumn",
      headerName: size.id,
      valueGetter: ({ data }): SizeQuantity => data!.sizes?.[size.id],
      valueSetter: ({ data, newValue }: QuantitySetParams) => {
        const quantity = toQuantity(newValue.quantity);
        const sizeData = data!.sizes?.[size.id];
        if (typeof quantity === "number" && sizeData) {
          data.sizes[size.id] = {
            ...sizeData,
            quantity,
          };
          return true;
        }
        return false;
      },
    };
  } else if (size.sizeGroup === product.sizes[0].sizeGroup) {
    return {
      type: "quantityColumn",
      headerName: size.name,
      valueGetter: ({ data }): SizeQuantity =>
        data?.sizes?.[`${data.sizeGroup} - ${size.name}`],
      valueSetter: ({ data, newValue }: QuantitySetParams) => {
        const quantity = toQuantity(newValue.quantity);
        const sizeKey = `${data.sizeGroup} - ${size.name}`;
        const sizeData = data!.sizes?.[sizeKey];
        if (typeof quantity === "number" && sizeData) {
          data.sizes[sizeKey] = {
            ...sizeData,
            quantity,
          };
          return true;
        }
        return false;
      },
    };
  }
};

export const getColumnDefs: typeof getColumnDefsArray = (...args) => {
  const cols = getColumnDefsArray(...args).filter(Boolean);
  // console.log('columnDefs', cols);
  return cols;
};

export const getColumnDefsArray = ({
  levels,
  levelIndex,
  visibleLevels,
  product,
}: {
  levels: Level[];
  levelIndex: number;
  visibleLevels: VisibleLevels;
  product: Product | null;
  appContext: AppContext;
}): ColDef<GridGroupDataItem>[] => {
  const level = levels[levelIndex];
  const hasSizeGroups = !!product?.sizes?.some((s) => !!s.sizeGroup);

  /** Leftmost pinned column the grid is grouped by */
  let groupCol: ColDef<GridGroupDataItem> = groupCols[level as SelectableLevel];
  if (groupCol && (level !== "sizeGroup" || hasSizeGroups)) {
    groupCol = {
      colId: level,
      ...groupCol,
      ...selectableCols[level],
      cellRenderer: "agGroupCellRenderer",
      pinned: "left",
      lockPinned: true,
      lockVisible: true,
      suppressSizeToFit: true,
    };
    groupCol.minWidth && (groupCol.minWidth += 60);
  }

  /** If it's a top level, an array of the groupable columns that are not added to grouping */
  const nonGroup =
    levelIndex === 0
      ? allLevels
          .filter((l) => l !== level && l !== "sizeGroup" && !visibleLevels[l])
          .map(
            (l): ColDef => ({
              colId: l,
              ...groupCols[l],
              ...selectableCols[l],
            })
          )
      : [];

  /** Quantity columns are visible only at the innermost level when a product is available */
  const sizeCols =
    ((levelIndex < levels.length - 1 &&
      product?.sizes
        .map((size) =>
          getQuantityColumn({
            size,
            product,
            hasSizeGroups,
            visibleLevels,
          })
        )
        .filter((col) => !!col)) as ColDef<GridGroupDataItem>[]) || [];

  switch (level) {
    case "product":
      return [
        groupCol,
        ...nonGroup,
        {
          headerName: "Department",
          field: "product.department",
          minWidth: 100,
          sortable: true,
        },
        {
          headerName: "Cost",
          field: "product.wholesale",
          minWidth: 100,
          sortable: true,
          type: "priceColumn",
        },
        {
          headerName: "Retail",
          field: "product.retail",
          minWidth: 100,
          sortable: true,
          type: "priceColumn",
        },
        ...levelTotals,
        ...sizeCols,
      ];
    case "warehouse":
      return [
        groupCol,
        ...nonGroup,
        {
          headerName: "Code",
          field: "warehouse.code",
          minWidth: 100,
          initialWidth: 100,
          sortable: true,
        },
        {
          headerName: "Country",
          field: "warehouse.country",
          minWidth: 121,
          initialWidth: 121,
          sortable: true,
        },
        {
          headerName: "Postal Code",
          field: "warehouse.zip",
          minWidth: 121,
          initialWidth: 121,
          sortable: true,
        },
        ...levelTotals,
        ...sizeCols,
      ];
    case "shipment":
      return [groupCol, ...nonGroup, ...sizeCols, ...levelTotals];
    case "sizeGroup":
      return [groupCol, ...sizeCols, ...levelTotals];
    default:
      return [...sizeCols, ...levelTotals];
  }
};
