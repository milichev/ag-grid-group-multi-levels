import {
  ColDef,
  ValueFormatterParams,
  ValueSetterParams,
} from "ag-grid-community";
import _ from "lodash";
import {
  GridGroupDataItem,
  Product,
  Size,
  SizeQuantity,
  VisibleLevels,
} from "../../../types";
import { formats, toQuantity } from "../../../helpers/conversion";
import { getSizeKey } from "../../../helpers/resolvers";
import { SizeQuantityEditor } from "../components/SizeQuantityEditor";
import { SizeGridAggFunc, SizeGridColDef } from "../types";

const valueFormatter = (
  params: CastProp<
    ValueFormatterParams<GridGroupDataItem>,
    "value",
    SizeQuantity | undefined
  >
) =>
  typeof params.value?.quantity === "number"
    ? formats.units.format(params.value.quantity)
    : "";

type QuantitySetParams = CastProp<
  ValueSetterParams<GridGroupDataItem>,
  "newValue",
  SizeQuantity
>;

const valueParser: ColDef["valueParser"] = (params) =>
  toQuantity(params.newValue);

const equals = (a: SizeQuantity, b: SizeQuantity) =>
  a?.quantity === b?.quantity;

const comparator: SizeGridColDef["comparator"] = (
  a: SizeQuantity,
  b: SizeQuantity
) => a?.quantity - b?.quantity;

type AggQuantity = Pick<SizeQuantity, "quantity">;

const aggFunc: SizeGridAggFunc<SizeQuantity> = (params) =>
  _.filter<SizeQuantity>(params.values, (q) => !!q).reduce<AggQuantity>(
    (acc, s) => {
      acc.quantity += s.quantity;
      return acc;
    },
    { quantity: 0 }
  );

const commonProps: SizeGridColDef = {
  type: "quantityColumn",
  cellEditorSelector: (params) =>
    params.value ? { component: SizeQuantityEditor } : undefined,
  lockPinned: true,
  sortable: true,
  comparator,
  equals,
  aggFunc,
  valueParser,
  valueFormatter,
};

const getValueSetter =
  (
    setSizeQuantity: (data: GridGroupDataItem, size: SizeQuantity) => void
  ): SizeGridColDef["valueSetter"] =>
  ({ data, newValue, oldValue }: QuantitySetParams) => {
    const quantity: number | undefined =
      newValue === null
        ? 0
        : // null quantity edit result means "Delete"
        newValue.quantity === null
        ? oldValue.quantity || 0
        : toQuantity(newValue.quantity);

    if (typeof quantity !== "number" || oldValue) {
      return false;
    }

    setSizeQuantity(data, {
      ...oldValue,
      quantity,
    });
    return true;
  };

export const getQuantityColumn = ({
  size,
  product,
  visibleLevels,
  hasSizeGroups,
}: {
  size: Size;
  product: Product;
  visibleLevels: VisibleLevels;
  hasSizeGroups: boolean;
}): SizeGridColDef | undefined => {
  if (visibleLevels.sizeGroup === undefined || !hasSizeGroups) {
    return {
      ...commonProps,
      colId: size.id,
      headerName: size.id,
      valueGetter: (params): SizeQuantity => {
        if (!params.data) {
          return undefined;
        }
        return params.data.sizes?.[size.id];
      },
      valueSetter: getValueSetter((data, sizeQuantity) => {
        data.sizes[size.id] = sizeQuantity;
      }),
    };
  } else if (size.sizeGroup === product.sizes[0].sizeGroup) {
    return {
      ...commonProps,
      colId: size.name,
      headerName: size.name,
      valueGetter: (params): SizeQuantity =>
        params.data?.sizes?.[getSizeKey(size.name, params.data.sizeGroup)],
      valueSetter: getValueSetter((data, sizeQuantity) => {
        data.sizes[getSizeKey(size.name, data.sizeGroup)] = sizeQuantity;
      }),
    };
  }
};
