import _ from "lodash";
import {
  GridDataItem,
  ShipmentsMode,
  Product,
  Shipment,
  Warehouse,
} from "../interfaces";
import { getDataItemId } from "./resolvers";
import { measureStep, nuPerf, wrap } from "./perf";
import { getSizeQuantities } from "./dataSource";

export const prepareItems = wrap(
  ({
    shipmentsMode,
    isAllDeliveries,
    items,
    buildOrderShipments,
  }: {
    shipmentsMode: ShipmentsMode;
    isAllDeliveries: boolean;
    items: GridDataItem[];
    buildOrderShipments: Shipment[];
  }) => {
    nuPerf.clearContext("prepareItems");
    if (isAllDeliveries || shipmentsMode === ShipmentsMode.BuildOrder) {
      const collectStep = measureStep({
        name: "prepareItemsCollect",
        async: false,
      });

      const allProducts = new Map<string, Product>();
      const allWarehouses = new Map<string, Warehouse>();
      const allShipments = new Map<string, Shipment>();
      const itemIds = new Set<GridDataItem["id"]>();

      if (shipmentsMode === ShipmentsMode.BuildOrder) {
        buildOrderShipments.forEach((shipment) =>
          allShipments.set(shipment.id, shipment)
        );
      }

      items.forEach((item) => {
        itemIds.add(item.id);

        if (!allProducts.has(item.product.id)) {
          allProducts.set(item.product.id, item.product);
        }
        if (!allWarehouses.has(item.warehouse.id)) {
          allWarehouses.set(item.warehouse.id, item.warehouse);
        }
        if (!allShipments.has(item.shipment.id)) {
          allShipments.set(item.shipment.id, item.shipment);
        }
      });

      collectStep.finish();

      const populateStep = measureStep({
        name: "prepareItemsPopulate",
        async: false,
      });

      items = items.slice();

      // populate missing items, if any
      allProducts.forEach((product) => {
        let productSizeQuantities:
          | ReturnType<typeof getSizeQuantities>
          | undefined;

        allWarehouses.forEach((warehouse) =>
          allShipments.forEach((shipment) => {
            const id = getDataItemId(product, warehouse, shipment);
            if (!itemIds.has(id)) {
              const empty: GridDataItem = {
                id,
                product,
                warehouse,
                shipment,
                ...(productSizeQuantities
                  ? _.clone(productSizeQuantities)
                  : (productSizeQuantities = getSizeQuantities(product.sizes))),
              };
              items.push(empty);
            }
          })
        );
      });

      populateStep.finish();
    }

    return items;
  },
  "prepareItems",
  false
);
