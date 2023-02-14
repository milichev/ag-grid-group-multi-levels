import {
  ValueFormatterParams,
  ColDef,
  ValueSetterParams,
} from "ag-grid-community";
import {
  GridGroupDataItem,
  Product,
  Size,
  SizeQuantity,
  VisibleLevels,
} from "../../../interfaces";
import { formats, toQuantity } from "../../../helpers/conversion";
import { getSizeKey } from "../../../helpers/resolvers";
import { SizeQuantityEditor } from "../components/SizeQuantityEditor";

const quantityValueFormatter = (
  params: CastProp<
    ValueFormatterParams<GridGroupDataItem>,
    "value",
    SizeQuantity
  >
) => formats.units.format(params.value.quantity);

type QuantitySetParams = CastProp<
  ValueSetterParams<GridGroupDataItem>,
  "newValue",
  SizeQuantity
>;

const valueParser: ColDef["valueParser"] = (params) =>
  toQuantity(params.newValue);

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
  if (!visibleLevels.sizeGroup || !hasSizeGroups) {
    return {
      type: "quantityColumn",
      headerName: size.id,
      cellEditor: SizeQuantityEditor,
      valueParser,
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
      valueFormatter: quantityValueFormatter,
    };
  } else if (size.sizeGroup === product.sizes[0].sizeGroup) {
    return {
      type: "quantityColumn",
      headerName: size.name,
      cellEditor: SizeQuantityEditor,
      valueParser,
      valueGetter: ({ data }): SizeQuantity =>
        data?.sizes?.[getSizeKey(size.name, data.sizeGroup)],
      valueSetter: ({ data, newValue }: QuantitySetParams) => {
        const quantity = toQuantity(newValue.quantity);
        const sizeKey = getSizeKey(size.name, data.sizeGroup);
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
      valueFormatter: quantityValueFormatter,
    };
  }
};
