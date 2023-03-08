import { ShipmentsMode } from "../../../data/types";
import { allLevels } from "../../../constants";
import { MenuItemDef } from "ag-grid-community";
import { GridContext, SizeGridProps } from "../types";

export const getContextMenuItems: SizeGridProps["getContextMenuItems"] = (
  params
) => {
  const {
    levels,
    levelIndex,
    sizeGridContext: { shipmentsMode, isAllDeliveries },
  }: GridContext = params.context;
  const gridItem = params.node.data;
  const menuItems: (string | MenuItemDef)[] = [];

  switch (levels[levelIndex]) {
    case "product":
      menuItems.push({
        name: "Remove Product",
        action: () => {
          alert(
            `All line items for the ${allLevels
              .reduce((acc, l) => {
                const entity: any = gridItem[l];
                if (entity) {
                  acc.push(`${l} "${entity.name || entity.id}"`);
                }
                return acc;
              }, [])
              .join(", ")} will be deleted`
          );
        },
      });
      break;
    case "shipment":
      if (shipmentsMode === ShipmentsMode.LineItems) {
        menuItems.push(
          {
            name: "Change Dates...",
            action: () => {
              alert(`Here we'll display a dialog with calendar`);
            },
          },
          {
            name: "Remove Shipment",
            action: () => {
              alert(`Here we'll delete the shipment ${gridItem.shipment.id}`);
            },
          }
        );
      } else {
        menuItems.push({
          name: "Cannot remove shipments in Build Order",
          disabled: true,
        });
      }
      break;
  }

  const childLevel = levels[levelIndex + 1];
  switch (childLevel) {
    case "shipment":
      if (shipmentsMode === ShipmentsMode.LineItems) {
        if (isAllDeliveries) {
          menuItems.push({
            name: "Cannot add a shipments when All Deliveries is on",
            disabled: true,
          });
        } else {
          menuItems.push({
            name: "Add Shipment",
            subMenu: [
              {
                name: "Delivery Window 1",
              },
              {
                name: "Delivery Window 2",
              },
              {
                name: "Pick Dates...",
              },
            ],
          });
        }
      }
      break;
    case "warehouse":
      if (shipmentsMode === ShipmentsMode.LineItems) {
        menuItems.push({
          name: "Add a Warehouse",
          subMenu: [
            {
              name: "Unlisted Warehouse 1",
            },
            {
              name: "Unlisted Warehouse 1",
            },
          ],
        });
      }
      break;
  }

  return menuItems;
};
