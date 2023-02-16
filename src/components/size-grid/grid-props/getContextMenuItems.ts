import { AgGridReactProps } from "ag-grid-react";
import { GridGroupDataItem, ShipmentsMode } from "../../../interfaces";
import { levels as allLevels } from "../../../constants";
import { GridContext } from "../../../hooks/useAppContext";
import { MenuItemDef } from "ag-grid-community";

export const getContextMenuItems: AgGridReactProps<GridGroupDataItem>["getContextMenuItems"] =
  (params) => {
    const {
      levels,
      levelIndex,
      appContext: { shipmentsMode },
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
