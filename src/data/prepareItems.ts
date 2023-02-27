import { GridDataItem, Shipment, ShipmentsMode, SizeInfo } from "./types";
import { collectEntities, getDataItemId } from "./resolvers";
import { measureStep, nuPerf, wrap } from "../helpers/perf";
import { getSizeQuantities } from "./getFake";
import { AppContext } from "../hooks/useAppContext";

export const prepareItems = wrap(
  ({
    shipmentsMode,
    isAllDeliveries,
    items,
    buildOrderShipments,
  }: {
    shipmentsMode: ShipmentsMode;
    items: GridDataItem[];
    buildOrderShipments: Shipment[];
  } & Pick<AppContext, "isAllDeliveries">) => {
    nuPerf.clearContext("prepareItems");
    if (isAllDeliveries || shipmentsMode === ShipmentsMode.BuildOrder) {
      const collectStep = measureStep({
        name: "prepareItemsCollect",
        async: false,
      });

      const { itemIds, products, warehouses, shipments } =
        collectEntities(items);

      if (shipmentsMode === ShipmentsMode.BuildOrder) {
        buildOrderShipments.forEach((shipment) =>
          shipments.set(shipment.id, shipment)
        );
      }

      collectStep.finish();

      const populateStep = measureStep({
        name: "prepareItemsPopulate",
        async: false,
      });

      items = items.slice();

      // populate missing items, if any
      products.forEach((product) => {
        let productSizeQuantities: SizeInfo | undefined;

        warehouses.forEach((warehouse) =>
          shipments.forEach((shipment) => {
            const id = getDataItemId(product, warehouse, shipment);
            if (!itemIds.has(id)) {
              if (!productSizeQuantities) {
                productSizeQuantities = getSizeQuantities(product.sizes);
              }
              const empty: GridDataItem = {
                id,
                product,
                warehouse,
                shipment,
                sizeIds: productSizeQuantities.sizeIds.slice(),
                sizes: cloneSizeQuantities(productSizeQuantities),
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

const cloneSizeQuantities = (sizeInfo: SizeInfo) =>
  sizeInfo.sizeIds.reduce((acc, id) => {
    acc[id] = {
      ...sizeInfo[id],
      quantity: 0,
    };
    return acc;
  }, {} as SizeInfo["sizes"]);
