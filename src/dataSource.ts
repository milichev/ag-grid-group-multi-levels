import {
  GridDataItem,
  Product,
  Shipment,
  Warehouse,
  Size,
  GridSize,
} from "./interfaces";
import Chance from "chance";

const chance = new Chance();

const getId = chance.hash.bind(chance, { length: 24 });
const getIds = (count: number): string[] => chance.unique(getId, count);
const getWords = (count: number): string[] =>
  chance
    .unique(
      () => chance.word({ length: chance.integer({ min: 6, max: 12 }) }),
      count
    )
    .map(chance.capitalize);

function* gen<T, K = T>(create: () => T, getKey?: (v: T) => K) {
  const keys = new Set<K>();
  while (true) {
    let value: T;
    let key: K;
    do {
      value = create();
      key = getKey?.(value) ?? (value as any);
    } while (keys.has(key));
    keys.add(key);
    yield value;
  }
}

const ids = gen<string>(getId);
const images = gen(() => chance.avatar());
const locations = gen(() => chance.province({ full: true }));

function* genProducts() {
  const names = gen(() => `${chance.animal()} ${chance.first()}`);
  const colors = gen(() => chance.color());

  let id: string | void;
  let name: string | void;
  let color: string | void;

  while (
    (id = ids.next().value) &&
    (name = names.next().value) &&
    (color = colors.next().value)
  ) {
    const product: Product = {
      id,
      name,
      color,
      retail: chance.floating({ fixed: 2, min: 4, max: 600 }),
      wholesale: chance.floating({ fixed: 2, min: 3, max: 500 }),
      sizes: [],
    };
    yield product;
  }
}

const prods = genProducts();
// console.log("prod", prods.next().value)

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
  const products = getProducts(productCount, sizeGroupCount);
  const warehouses = getWarehouses(warehouseCount);
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
              id: getId(),
              name: size.name,
              sizeGroup: size.sizeGroup,
              quantity: chance.integer({ min: 0, max: 1000 }),
            };
            return acc;
          }, {} as Record<string, GridSize>),
        });
      });
    });
  });

  return items;
};

const getProducts = (count = 5, sizeGroupCount = 3) => {
  const ids = getIds(count);
  const names = getWords(count);

  return ids.map((id, i): Product => {
    const sizeGroups = chance.bool({ likelihood: 20 })
      ? getWords(chance.integer({ min: 2, max: sizeGroupCount }))
      : [""];
    const sizeNames = getWords(chance.integer({ min: 2, max: 4 }));
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
      id,
      name: names[i],
      color: chance.color(),
      retail: chance.floating({ fixed: 2, min: 4, max: 600 }),
      wholesale: chance.floating({ fixed: 2, min: 3, max: 500 }),
      sizes,
    };
  });
};

const getWarehouses = (count = 5) => {
  const ids = getIds(count);
  const names = getWords(count);
  return ids.map(
    (id, i): Warehouse => ({
      id,
      name: names[i],
      zip: chance.zip(),
    })
  );
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
