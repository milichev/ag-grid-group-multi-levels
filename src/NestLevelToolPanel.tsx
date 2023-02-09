import React, { useCallback, useContext, useMemo, createContext } from "react";
import "./styles.css";
import { Level, GridGroupDataItem, NestLevelItem } from "./interfaces";
import { DebugBox } from "./DebugBox";
import { useAppContext } from "./appContext";
import { measureStep, wrap, nuPerf, context as perfContext } from "./perf";

export const NestLevelToolPanel: React.FC = () => {
  const { levelItems, setLevelItems } = useAppContext();

  const handleVisibleChange = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const visible = e.target.checked;
      const items = levelItems.map((item) =>
        item.level === level ? { ...item, visible } : item
      );
      setLevelItems(items);
    },
    [levelItems, setLevelItems]
  );

  const handlePosClick = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const isUp = e.target.getAttribute("data-dir") === "up";
      const i = levelItems.findIndex((item) => item.level === level);
      if (i > 0 && isUp) {
        setLevelItems([
          ...levelItems.slice(0, i - 1),
          levelItems[i],
          levelItems[i - 1],
          ...levelItems.slice(i + 1)
        ]);
      } else if (i < levelItems.length - 1 && !isUp) {
        setLevelItems([
          ...levelItems.slice(0, i),
          levelItems[i + 1],
          levelItems[i],
          ...levelItems.slice(i + 2)
        ]);
      }
    },
    [levelItems, setLevelItems]
  );

  return (
    <div className="nest-mode-tool-panel">
      <h3>Product Levels</h3>
      <ul className="mode-list">
        {levelItems.map(({ level, visible }, i) => {
          const enabled = level !== "product";
          let upEnabled = i > 0;
          let downEnabled = i < levelItems.length - 1;
          switch (level) {
            case "product":
              downEnabled =
                downEnabled && levelItems[i + 1].level !== "sizeGroup";
              break;
            case "sizeGroup":
              upEnabled = upEnabled && levelItems[i - 1].level !== "product";
              break;
          }
          return (
            <li key={level}>
              <label>
                <input
                  type="checkbox"
                  checked={visible}
                  disabled={!enabled}
                  onChange={handleVisibleChange}
                  data-level={level}
                />
                {level}
              </label>
              <div className="dir-buttons">
                <button
                  data-level={level}
                  data-dir="up"
                  disabled={!upEnabled}
                  onClick={handlePosClick}
                >
                  ⬆︎
                </button>
                <button
                  data-level={level}
                  data-dir="down"
                  disabled={!downEnabled}
                  onClick={handlePosClick}
                >
                  ⬇︎
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <DebugBox />
    </div>
  );
};
