import React from "react";
import ReactDOM from "react-dom";
import ReactGA from "react-ga4";
import { GridAppPerf as App } from "./components/GridApp";
import "./styles.scss";

const gaMeasurementId = process.env["REACT_APP_GA_MEASUREMENT_ID"];
gaMeasurementId && ReactGA.initialize(gaMeasurementId);

const origConsoleError = console.error.bind(console);
console.error = (...args: any[]) => {
  const { stack } = new Error();
  if (
    (stack && /outputMissingLicenseKey/.test(stack)) ||
    args.some(
      (a) =>
        typeof a === "string" && a.includes("Warning: Invalid aria prop %s")
    )
  ) {
    return;
  }
  origConsoleError(...args);
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
