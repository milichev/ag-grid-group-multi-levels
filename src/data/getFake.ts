import { faker } from "@faker-js/faker";
import {
  GridDataItem,
  Product,
  Shipment,
  ShipmentsMode,
  Size,
  SizeInfo,
  Warehouse,
} from "./types";
import { SizeGridContext } from "../hooks/useSizeGridContext";
import { wrapObj } from "../helpers/perf";
import { getDataItemId, sortSizeNames } from "./resolvers";
import { toISODateString } from "../helpers/formatting";
import { getSizeQuantities } from "./prepareItems";
import { regularSizeNames } from "../constants";

const attempt = <T>(
  get: () => T,
  isOk: (v: T) => boolean,
  { attempts = 50 }: { attempts?: number } = {}
) => {
  let tries = 0;
  let v: T;
  do {
    if (attempts > 0 && tries >= attempts) {
      throw new Error(`max ${attempts} attempts reached`);
    }
    tries += 1;
    v = get();
  } while (!isOk(v));
  return v;
};

const basic = {
  id: () => faker.datatype.hexadecimal({ case: "upper", length: 24 }).slice(2),
  productName: () => faker.commerce.productName(),
  warehouseName: () => faker.address.city(),
  sizeName: () =>
    faker.word.adjective({ length: { min: 2, max: 6 }, strategy: "shortest" }),
  warehouseCode: () => faker.address.stateAbbr(),
  departmentName: () => faker.commerce.department(),
  gender: () =>
    attempt(
      () => faker.name.gender(),
      (g) => g.split(/[\s*]/gi).length === 1
    ),
} as const;

const wrapUnique = <T extends Record<string, () => any>>(methods: T) =>
  (Object.keys(methods) as [keyof T]).reduce((acc, key) => {
    const method = methods[key];
    const store = {};
    acc[key] = () => faker.helpers.unique(method, undefined, { store });
    return acc;
  }, {} as { [K in keyof T]: () => ReturnType<T[K]> });

const uniqueBasic = wrapUnique(basic);

const entity = {
  product: ({
    departments,
    isUseSizeGroups,
    isLimitedSizes,
  }: {
    departments: DepartmentMap;
  } & Pick<SizeGridContext, "isUseSizeGroups" | "isLimitedSizes">): Product => {
    const department = faker.helpers.arrayElement(Object.keys(departments));

    const sizeGroups = (isUseSizeGroups &&
      faker.helpers.maybe(() => departments[department].sizeGroups, {
        probability: 0.3,
      })) || [""];

    const sizeNames: string[] = sortSizeNames(
      isLimitedSizes
        ? faker.helpers.arrayElements(
            departments[department].sizes,
            faker.datatype.number({
              min: departments[department].sizes.length / 3,
              max: departments[department].sizes.length,
            })
          )
        : faker.helpers.uniqueArray(
            basic.sizeName,
            faker.datatype.number({ min: 2, max: 4 })
          )
    );

    const sizes: Size[] = [];
    sizeGroups.forEach((sizeGroup) => {
      sizeNames.forEach((sizeName) => {
        sizes.push({
          id: sizeGroup ? `${sizeGroup} - ${sizeName}` : sizeName,
          name: sizeName,
          sizeGroup,
        });
      });
    });

    const retail = faker.datatype.number({
      precision: 0.01,
      min: 4,
      max: 1200,
    });
    const wholesale =
      retail * faker.datatype.number({ precision: 0.001, min: 0.5, max: 0.95 });

    return {
      id: uniqueBasic.id(),
      image: faker.image.fashion(),
      name: uniqueBasic.productName(),
      color: faker.color.human(),
      department,
      gender: faker.helpers.arrayElement(["male", "female", "other"]),
      retail,
      wholesale,
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

type DepartmentData = {
  sizeGroups: string[];
  sizes: string[];
};
type DepartmentMap = Record<string, DepartmentData>;

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
  };
  buildOrderShipments: Shipment[];
} & Pick<
  SizeGridContext,
  "shipmentsMode" | "isLimitedSizes" | "isUseSizeGroups"
>): GridDataItem[] => {
  const departmentNames = faker.helpers.uniqueArray(
    faker.commerce.department,
    counts.products / 5
  );
  const predefinedSizeGroups = [
    faker.helpers.uniqueArray(basic.gender, 4),
    ["Earthlings", "Xenomorphs", "Unicorns"],
    ["Silver", "Gold", "Platinum", "Plutonium"],
    faker.helpers.uniqueArray(faker.commerce.productMaterial, 3),
    ["Petite", "Regular", "Small"],
  ];
  const predefinedSizeNames = [
    [...Array(13)].map((_u, i) => `${6 + i * 0.5}`),
    // ["S", "M", "L"],
    regularSizeNames,
    // ["XXXS", "XXS", "XS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  ];

  const departments = departmentNames.reduce((acc, nm) => {
    acc[nm] = {
      sizeGroups: faker.helpers.arrayElement(predefinedSizeGroups),
      sizes: isLimitedSizes
        ? faker.helpers.arrayElement(predefinedSizeNames)
        : [],
    };
    return acc;
  }, {} as DepartmentMap);

  // get working products
  const products = faker.helpers.uniqueArray<Product>(
    () =>
      entity.product({
        departments,
        isUseSizeGroups,
        isLimitedSizes,
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

      const { sizes, sizeIds } = getSizeQuantities(product.sizes);

      shipments.forEach((shipment) => {
        items.push({
          id: getDataItemId(product, warehouse, shipment),
          product,
          warehouse,
          shipment,
          ...getRandQuantities({ sizes, sizeIds }),
        });
      });
    });
  });

  return items;
};

const getRandQuantities = ({ sizeIds, sizes }: SizeInfo): SizeInfo => ({
  sizeIds,
  sizes: sizeIds.reduce((acc, sizeId) => {
    acc[sizeId] = {
      ...sizes[sizeId],
      quantity: faker.datatype.number({ min: 0, max: 150 }),
    };
    return acc;
  }, {} as GridDataItem["sizes"]),
});

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + amount);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
};

const getShipments = (
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

export const getFake = wrapObj(
  {
    shipments: getShipments,
    gridData: getGridData,
  },
  "fake:"
);
