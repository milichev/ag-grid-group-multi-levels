import {
  ColDef,
  ValueFormatterParams,
  ValueSetterParams,
} from "ag-grid-community";
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

const quantityValueFormatter = (
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

const commonProps: ColDef<GridGroupDataItem> = {
  type: "quantityColumn",
  // cellEditor: SizeQuantityEditor,
  cellEditorSelector: (params) =>
    params.value ? { component: SizeQuantityEditor } : undefined,
  lockVisible: true,
  lockPinned: true,
  sortable: false,
  equals,
  valueParser,
  valueFormatter: quantityValueFormatter,
};

const getValueSetter =
  (
    setSizeQuantity: (data: GridGroupDataItem, size: SizeQuantity) => void
  ): ColDef<GridGroupDataItem>["valueSetter"] =>
  ({ data, newValue, oldValue }: QuantitySetParams) => {
    const quantity: number | undefined =
      newValue === null
        ? 0
        : newValue.quantity === null
        ? oldValue.quantity || 0
        : toQuantity(newValue.quantity);
    // TODO: need to check correctness of the quantity application because it seems that new values are applied to bunch of rows instead.
    if (typeof quantity === "number" && oldValue) {
      setSizeQuantity(data, {
        ...oldValue,
        quantity,
      });
      return true;
    }
    return false;
  };

export const getQuantityColumn = ({
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
  if (visibleLevels.sizeGroup === undefined || !hasSizeGroups) {
    return {
      ...commonProps,
      colId: size.id,
      headerName: size.id,
      valueGetter: (params): SizeQuantity => {
        if (!params.data) {
          return undefined;
        }
        return params.data!.sizes?.[size.id];
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
      valueGetter: ({ data }): SizeQuantity =>
        data?.sizes?.[getSizeKey(size.name, data.sizeGroup)],
      valueSetter: getValueSetter((data, sizeQuantity) => {
        data.sizes[getSizeKey(size.name, data.sizeGroup)] = sizeQuantity;
      }),
    };
  }
};
