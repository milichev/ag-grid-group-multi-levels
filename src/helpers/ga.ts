import ReactGA from "react-ga4";
import { Level } from "../types";

export const gaEvents = {
  toggleLevel: (level: Level, visible: boolean) =>
    ReactGA.event({
      category: "levels",
      action: "level_toggle",
      label: level,
      value: visible ? 1 : 0,
    }),
};
