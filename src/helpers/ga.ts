import ReactGA from "react-ga4";
import { Level } from "../data/types";

export const gaEvents = {
  toggleLevel: (level: Level, visible: boolean) =>
    ReactGA.event({
      category: "grid_settings",
      action: "level_toggle",
      label: level,
      value: visible ? 1 : 0,
    }),
  rowGroup: (colId: string | undefined, groupColCount) =>
    ReactGA.event({
      category: "grid_settings",
      action: "row_group",
      label: colId ?? "-",
      value: groupColCount,
    }),
  appSettings: (setting: string, value: any) =>
    ReactGA.event({
      category: "grid_settings",
      action: setting,
      label: `${value}`,
    }),
};
