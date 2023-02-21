import { faker } from "@faker-js/faker";
import {
  GridDataItem,
  ShipmentsMode,
  Product,
  Shipment,
  Size,
  SizeQuantity,
  Warehouse,
} from "../types";
import { AppContext } from "../hooks/useAppContext";
import { wrap } from "./perf";
import { getDataItemId, getSizeKey } from "./resolvers";

const basic = {
  id: () => faker.datatype.hexadecimal({ case: "upper", length: 24 }).slice(2),
  productName: () => faker.commerce.productName(),
  warehouseName: () => faker.address.city(),
  warehouseCode: () => faker.address.stateAbbr(),
} as const;

const wrapUnique = <T extends Record<string, () => any>>(methods: T) =>
  (Object.keys(methods) as [keyof T]).reduce((acc, key) => {
    const method = methods[key];
    acc[key] = () => faker.helpers.unique(method);
    return acc;
  }, {} as { [K in keyof T]: () => ReturnType<T[K]> });

const uniqueBasic = wrapUnique(basic);

const entity = {
  product: ({
    sizeGroupCount = 3,
    departments = [],
    limitedSizes,
    isUseSizeGroups,
  }: {
    sizeGroupCount?: number;
    departments?: string[] | null;
    limitedSizes?: Size[];
  } & Pick<AppContext, "isUseSizeGroups">): Product => {
    const retail = faker.datatype.number({
      precision: 0.01,
      min: 4,
      max: 1200,
    });

    const sizeGroups = (isUseSizeGroups &&
      faker.helpers.maybe(
        () =>
          faker.helpers.uniqueArray(
            faker.random.word,
            faker.datatype.number({ min: 2, max: sizeGroupCount })
          ),
        { probability: 0.3 }
      )) || [""];

    let sizes: Size[];

    if (limitedSizes) {
      sizes = faker.helpers.arrayElements(
        limitedSizes,
        faker.datatype.number({
          min: limitedSizes.length * 0.75,
          max: limitedSizes.length,
        })
      );
    } else {
      sizes = [];
      const sizeNames = faker.helpers.uniqueArray(
        faker.company.catchPhraseDescriptor,
        faker.datatype.number({ min: 2, max: 4 })
      );
      sizeGroups.forEach((sizeGroup) => {
        sizeNames.forEach((sizeName) => {
          sizes.push({
            id: sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName,
            name: sizeName,
            sizeGroup,
          });
        });
      });
    }

    return {
      id: uniqueBasic.id(),
      image: faker.image.fashion(),
      name: uniqueBasic.productName(),
      color: faker.color.human(),
      department: departments
        ? faker.helpers.arrayElement(departments)
        : faker.commerce.department(),
      gender: faker.helpers.arrayElement(["male", "female", "other"]),
      retail,
      wholesale:
        retail *
        faker.datatype.number({ precision: 0.001, min: 0.5, max: 0.95 }),
      sizes,
    };
  },

  warehouse: (): Warehouse => ({
    id: uniqueBasic.id(),
    code: faker.helpers.arrayElement(["NJ", "AZ"]), //uniqueBasic.warehouseCode(),
    name: uniqueBasic.warehouseName(),
    zip: faker.address.zipCode(),
    country: faker.address.country(),
  }),
};

export const getGridData = ({
  counts,
  buildOrderShipments,
  shipmentsMode,
  isLimitedSizes,
  isUseSizeGroups,
}: {
  counts: {
    products: number;
    warehouses: number;
    sizeGroups: number;
  };
  buildOrderShipments: Shipment[];
} & Pick<
  AppContext,
  "shipmentsMode" | "isLimitedSizes" | "isUseSizeGroups"
>): GridDataItem[] => {
  const departments = faker.helpers.uniqueArray(
    faker.commerce.department,
    counts.products / 5
  );

  let limitedSizes: Size[] | undefined;
  if (isLimitedSizes) {
    limitedSizes = [];
    const sizeNames = ["XS", "XS", "S", "M", "L", "XL"];
    (isUseSizeGroups ? ["Men", "Women", "Children"] : [""]).forEach(
      (sizeGroup) => {
        sizeNames.forEach((sizeName) => {
          limitedSizes.push({
            id: sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName,
            name: sizeName,
            sizeGroup,
          });
        });
      }
    );
  }

  // get working products
  const products = faker.helpers.uniqueArray<Product>(
    () =>
      entity.product({
        sizeGroupCount: counts.sizeGroups,
        departments,
        limitedSizes,
        isUseSizeGroups,
      }),
    counts.products
  );
  // get all warehouses
  const warehouses = faker.helpers.uniqueArray(
    entity.warehouse,
    counts.warehouses
  );

  // having all the data used in the order,
  // create the order representation as a set of combinations of all products, warehouses, and shipments.
  const items: GridDataItem[] = [];
  products.forEach((product) => {
    warehouses.forEach((warehouse) => {
      const shipments =
        shipmentsMode === ShipmentsMode.BuildOrder
          ? faker.helpers.arrayElements(
              buildOrderShipments,
              faker.datatype.number({ min: 1 })
            )
          : getShipments(
              faker.datatype.number({
                min: 1,
                max: buildOrderShipments.length,
              }),
              {
                defaultDeliveryWindow: faker.helpers.arrayElement([
                  2, 7, 10, 14, 30,
                ]),
              }
            );

      shipments.forEach((shipment) => {
        items.push({
          id: getDataItemId(product, warehouse, shipment),
          product,
          warehouse,
          shipment,
          ...getSizeQuantities(product.sizes, true),
        });
      });
    });
  });

  return items;
};

export const getGridDataPerf = wrap(getGridData, "getGridData", false);

export const getSizeQuantities = (
  sizes: Size[],
  isRandQuantity = false
): Pick<GridDataItem, "sizes" | "sizeIds"> => {
  const sizeIds = [];
  const sizeQuantities = sizes.reduce((acc, size) => {
    const sizeId = getSizeKey(size.name, size.sizeGroup);
    sizeIds.push(sizeId);
    acc[sizeId] = {
      id: size.id,
      name: size.name,
      sizeGroup: size.sizeGroup,
      quantity: isRandQuantity
        ? faker.datatype.number({ min: 0, max: 150 })
        : 0,
    };
    return acc;
  }, {} as Record<string, SizeQuantity>);

  return { sizeIds, sizes: sizeQuantities };
};

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + amount);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
};

const toISODateString = (date: Date) => date.toISOString().slice(0, 10);

export const getShipments = (
  count: number,
  { defaultDeliveryWindow = 7, isBuildOrder = false } = {}
) => {
  const shipments: Shipment[] = [];
  [...Array(count)].forEach((_u, i) => {
    const startDate =
      i === 0 ? addDays(new Date(), 0) : addDays(shipments[i - 1].endDate, 1);
    const endDate = addDays(startDate, defaultDeliveryWindow);
    shipments.push({
      id: `${toISODateString(startDate)} - ${toISODateString(endDate)}`,
      startDate,
      endDate,
      isBuildOrder,
    });
  });
  return shipments;
};
