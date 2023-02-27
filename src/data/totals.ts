import { GridDataItem, GridGroupDataItem, Product, SizeInfo } from "./types";

export const collectGroupTotals = (group: GridDataItem[]) =>
  group.reduce(
    (acc, item) => {
      addSizesTotals(item, item.product, acc);
      return acc;
    },
    {
      ttlUnits: 0,
      ttlCost: 0,
    } as Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
  );

export const collectSizesTotals = (item: SizeInfo, product: Product) => {
  const acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost"> = {
    ttlUnits: 0,
    ttlCost: 0,
  };
  addSizesTotals(item, product, acc);
  return acc;
};

export const addSizesTotals = (
  sizeInfo: SizeInfo,
  product: Product,
  acc: Pick<GridGroupDataItem, "ttlUnits" | "ttlCost">
) =>
  sizeInfo.sizeIds?.forEach((sizeId) => {
    const size = sizeInfo.sizes[sizeId];
    acc.ttlUnits += size.quantity;
    acc.ttlCost += product.wholesale * size.quantity;
  });
