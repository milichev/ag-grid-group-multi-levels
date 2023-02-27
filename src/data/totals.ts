import { GridDataItem, Product, SizeInfo, TotalInfo } from "./types";

export const collectGroupTotals = (
  group: GridDataItem[],
  sizeGroup: string | undefined
) =>
  group.reduce(
    (acc, item) => {
      addTotals(item, item.product, sizeGroup, acc);
      return acc;
    },
    {
      units: 0,
      cost: 0,
    } as TotalInfo
  );

export const collectProductTotals = (
  sizeInfo: Partial<SizeInfo>,
  product: Product,
  sizeGroup: string | undefined
) => {
  const total: TotalInfo = {
    units: 0,
    cost: 0,
  };
  addTotals(sizeInfo, product, sizeGroup, total);
  return total;
};

export const addTotals = (
  sizeInfo: Partial<SizeInfo>,
  product: Product,
  sizeGroup: string | undefined,
  total: TotalInfo
) =>
  sizeInfo.sizeIds?.forEach((sizeId) => {
    const size = sizeInfo.sizes[sizeId];
    if (sizeGroup === undefined || size.sizeGroup === sizeGroup) {
      total.units += size.quantity;
      total.cost += product.wholesale * size.quantity;
    }
  });
