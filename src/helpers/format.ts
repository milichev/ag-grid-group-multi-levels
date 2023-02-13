/** Numeric cell formatters */
export const formats = {
  units: Intl.NumberFormat("en", { maximumFractionDigits: 0 }),
  money: Intl.NumberFormat("en", { style: "currency", currency: "USD" }),
};

export const getSizeKey = (sizeName: string, sizeGroup: string) =>
  sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName;
