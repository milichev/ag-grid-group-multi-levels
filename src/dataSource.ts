import { faker } from "@faker-js/faker";
import {
  GridDataItem,
  Product,
  Shipment,
  Warehouse,
  Size,
  GridSize,
} from "./interfaces";

const basic = {
  id: () => faker.datatype.hexadecimal({ case: "upper", length: 24 }),
  productName: () => faker.commerce.productName(),
  warehouseName: () => faker.address.city(),
} as const;

const wrapUnique = <T extends Record<string, () => any>>(methods: T) =>
  (Object.keys(methods) as [keyof T]).reduce((acc, key) => {
    const method = methods[key];
    acc[key] = () => faker.helpers.unique(method);
    return acc;
  }, {} as { [K in keyof T]: () => ReturnType<T[K]> });

const uniqueBasic = wrapUnique(basic);

const entity = {
  product: ({ sizeGroupCount = 3 }): Product => {
    const retail = faker.datatype.number({
      precision: 0.01,
      min: 4,
      max: 1200,
    });
    const sizeGroups = faker.helpers.maybe(
      () =>
        faker.helpers.uniqueArray(
          faker.random.word,
          faker.datatype.number({ min: 2, max: sizeGroupCount })
        ),
      { probability: 0.3 }
    ) ?? [""];
    const sizeNames = faker.helpers.uniqueArray(
      faker.company.catchPhraseDescriptor,
      faker.datatype.number({ min: 2, max: 4 })
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

    return {
      id: uniqueBasic.id(),
      name: uniqueBasic.productName(),
      color: faker.color.human(),
      retail,
      wholesale:
        retail *
        faker.datatype.number({ precision: 0.001, min: 0.5, max: 0.95 }),
      sizes,
    };
  },

  warehouse: (): Warehouse => ({
    id: uniqueBasic.id(),
    name: uniqueBasic.warehouseName(),
    zip: faker.address.zipCode(),
  }),
};

export const getGridData = ({
  productCount,
  shipmentCount,
  sizeGroupCount,
  warehouseCount,
}: {
  productCount: number;
  warehouseCount: number;
  shipmentCount: number;
  sizeGroupCount: number;
}): GridDataItem[] => {
  const products = faker.helpers.uniqueArray<Product>(
    entity.product.bind(entity, { sizeGroupCount }),
    productCount
  );
  const warehouses = faker.helpers.uniqueArray(
    entity.warehouse,
    warehouseCount
  );
  const shipments = getShipments(shipmentCount);
  const items: GridDataItem[] = [];

  products.forEach((product) => {
    warehouses.forEach((warehouse) => {
      shipments.forEach((shipment) => {
        items.push({
          product,
          warehouse,
          shipment,
          sizes: product.sizes.reduce((acc, size) => {
            acc[
              size.sizeGroup ? `${size.sizeGroup} - ${size.name}` : size.name
            ] = {
              id: size.id,
              name: size.name,
              sizeGroup: size.sizeGroup,
              quantity: faker.datatype.number({ min: 0, max: 1000 }),
            };
            return acc;
          }, {} as Record<string, GridSize>),
        });
      });
    });
  });

  return items;
};

const addDays = (date: Date, amount: number) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + amount);
  result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
  return result;
};

const toISODateString = (date: Date) => date.toISOString().slice(0, 10);

const getShipments = (count: number, defaultDeliveryWindow = 7) => {
  const shipments: Shipment[] = [];
  [...Array(count)].forEach((_u, i) => {
    const startDate =
      i === 0 ? addDays(new Date(), 0) : addDays(shipments[i - 1].endDate, 1);
    const endDate = addDays(startDate, defaultDeliveryWindow);
    shipments.push({
      id: `${toISODateString(startDate)} - ${toISODateString(endDate)}`,
      startDate,
      endDate,
    });
  });
  return shipments;
};
