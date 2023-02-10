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
      image: faker.image.fashion(),
      name: uniqueBasic.productName(),
      color: faker.color.human(),
      department: faker.commerce.department(),
      retail,
      wholesale:
        retail *
        faker.datatype.number({ precision: 0.001, min: 0.5, max: 0.95 }),
      sizes,
    };
  },

  warehouse: (): Warehouse => ({
    id: uniqueBasic.id(),
    code: uniqueBasic.warehouseCode(),
    name: uniqueBasic.warehouseName(),
    zip: faker.address.zipCode(),
    country: faker.address.country(),
  }),
};

export const getGridData = ({
  productCount,
  shipmentCount,
  sizeGroupCount,
  warehouseCount,
  isBuildOrder,
}: {
  productCount: number;
  warehouseCount: number;
  shipmentCount: number;
  sizeGroupCount: number;
  isBuildOrder: boolean;
}): GridDataItem[] => {
  const products = faker.helpers.uniqueArray<Product>(
    entity.product.bind(entity, { sizeGroupCount }),
    productCount
  );
  const warehouses = faker.helpers.uniqueArray(
    entity.warehouse,
    warehouseCount
  );
  const buildOrderShipments = isBuildOrder ? getShipments(shipmentCount) : [];
  const items: GridDataItem[] = [];

  products.forEach((product) => {
    warehouses.forEach((warehouse) => {
      const shipments = isBuildOrder
        ? buildOrderShipments
        : getShipments(
            faker.datatype.number({ min: 1, max: shipmentCount }),
            faker.helpers.arrayElement([2, 7, 30])
          );

      shipments.forEach((shipment) => {
        const sizeIds = [];
        const sizes = product.sizes.reduce((acc, size) => {
          const sizeId = size.sizeGroup
            ? `${size.sizeGroup} - ${size.name}`
            : size.name;
          sizeIds.push(sizeId);
          acc[sizeId] = {
            id: size.id,
            name: size.name,
            sizeGroup: size.sizeGroup,
            quantity: faker.datatype.number({ min: 0, max: 150 }),
          };
          return acc;
        }, {} as Record<string, GridSize>);
        items.push({
          product,
          warehouse,
          shipment,
          sizes,
          sizeIds,
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
