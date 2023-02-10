import { ColDef, ValueGetterParams } from "ag-grid-community";

import {
  Product,
  Level,
  levels as allLevels,
  VisibleLevels,
  SelectableLevel,
  GridGroupDataItem,
} from "./interfaces";

const formats = {
  units: Intl.NumberFormat("en", { maximumFractionDigits: 0 }),
  money: Intl.NumberFormat("en", { style: "currency", currency: "USD" }),
};

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

const toQuantity = (val: string) => /^\d+$/.test(val) && Number.parseInt(val);

export const getColumnDefs: typeof getColumnDefsArray = (...args) => {
  const cols = getColumnDefsArray(...args).filter(Boolean);
  // console.log('columnDefs', cols);
  return cols;
};

export const getColumnDefsArray = (
  levels: Level[],
  levelIndex: number,
  visibleLevels: VisibleLevels,
  product: Product | null
): ColDef<GridGroupDataItem>[] => {
  const level = levels[levelIndex];
  const hasSizeGroups = !!product?.sizes?.some((s) => !!s.sizeGroup);

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
    };
    groupCol.minWidth += 60;
  }

  const nonGroup =
    levelIndex === 0
      ? allLevels
          .filter((l) => l !== level && l !== "sizeGroup" && !visibleLevels[l])
          .map((l): ColDef => ({ ...groupCols[l], ...selectableCols[l] }))
      : [];

  const levelTotals: ColDef<GridGroupDataItem>[] = [
    {
      headerName: "TTL Units",
      field: "ttlUnits",
      type: "numericColumn",
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

  const other = [...nonGroup];

  const sizeCols =
    !product || levelIndex < levels.length - 1
      ? []
      : product.sizes.reduce((acc, size) => {
          let col: ColDef<GridGroupDataItem> | undefined;

          if (visibleLevels.sizeGroup && hasSizeGroups) {
            if (size.sizeGroup === product.sizes[0].sizeGroup) {
              col = {
                type: "quantityColumn",
                headerName: size.name,
                valueGetter: ({ data }) =>
                  data?.sizes?.[`${data.sizeGroup} - ${size.name}`].quantity ??
                  0,
                valueSetter: ({ data, newValue }) => {
                  const val = toQuantity(newValue);
                  const sizeData =
                    data!.sizes?.[`${data.sizeGroup} - ${size.name}`];
                  if (val && sizeData) {
                    sizeData.quantity = val;
                    return true;
                  }
                  return false;
                },
              };
            }
          } else {
            col = {
              type: "quantityColumn",
              headerName: size.id,
              valueGetter: ({ data }) => data!.sizes?.[size.id].quantity ?? 0,
              valueSetter: ({ data, newValue }) => {
                const val = toQuantity(newValue);
                const sizeData = data!.sizes?.[size.id];
                if (val && sizeData) {
                  sizeData.quantity = val;
                  return true;
                }
                return false;
              },
            };
          }

          if (col) {
            acc.push(col);
          }
          return acc;
        }, [] as ColDef<GridGroupDataItem>[]);

  switch (level) {
    case "product":
      return [
        groupCol,
        ...other,
        {
          headerName: "Wholesale",
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
      return [...sizeCols];
  }
};
