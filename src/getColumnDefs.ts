import { ColDef, ValueGetterParams } from "ag-grid-community";

import {
  Product,
  Level,
  levels as allLevels,
  VisibleLevels,
  SelectableLevel,
  GridGroupDataItem,
} from "./interfaces";

const groupColDefs: Record<SelectableLevel, ColDef<GridGroupDataItem>> = {
  product: {
    headerName: "Product Name",
    // field: 'product.name',
    filter: "agTextColumnFilter",
    minWidth: 140,
    initialWidth: 160,
    sortable: true,
    valueGetter: (params: ValueGetterParams) => {
      const item = params.data as GridGroupDataItem;
      return `${item.product?.name}${
        item.product?.sizes?.some((s) => !!s.sizeGroup) ? " *" : ""
      }`;
    },
  },
  warehouse: {
    headerName: "Warehouse",
    field: "warehouse.name",
    filter: "agTextColumnFilter",
    sortable: true,
    minWidth: 200,
  },
  shipment: {
    headerName: "Shipment",
    field: "shipment.startDate",
    filter: "agSetColumnFilter",
    sortable: true,
    minWidth: 220,
    initialWidth: 220,
    filterParams: {
      suppressAndOrCondition: true,
    },
    valueFormatter: (params) => params.data?.shipment?.id ?? "",
  },
  sizeGroup: {
    headerName: "Size Group",
    field: "sizeGroup",
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
    valueFormatter: (params) => "$" + params.value?.toFixed?.(2),
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

  let groupCol: ColDef<GridGroupDataItem> =
    groupColDefs[level as SelectableLevel];
  if (groupCol && (level !== "sizeGroup" || hasSizeGroups)) {
    groupCol = {
      ...groupCol,
      minWidth: groupCol.minWidth! + 60,
      cellRenderer: "agGroupCellRenderer",
      pinned: "left",
      lockPinned: true,
      lockVisible: true,
    };
  }

  const nonGroup =
    levelIndex === 0
      ? allLevels
          .filter((l) => l !== level && l !== "sizeGroup" && !visibleLevels[l])
          .map((l): ColDef => groupColDefs[l])
      : [];

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
        ...nonGroup,
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
        ...sizeCols,
      ];
    case "shipment":
      return [groupCol, ...nonGroup, ...sizeCols];
    case "sizeGroup":
      return [groupCol, ...sizeCols];
    default:
      return [...sizeCols];
  }
};
