import React, { useCallback, useEffect } from "react";
import { DebugBox } from "./DebugBox";
import { useAppContext } from "../hooks/useAppContext";
import {
  fixupLevelItems,
  getLevelIndex,
  getLevelMeta,
  toggleLevelItem,
} from "../helpers/levels";
import { ShipmentsMode } from "../interfaces";

export const LevelsToolPanel: React.FC = () => {
  const {
    levelItems,
    setLevelItems,
    shipmentsMode,
    setShipmentsMode,
    isAllDeliveries,
    setIsAllDeliveries,
  } = useAppContext();

  const handleVisibleChange = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const visible = e.target.checked;
      toggleLevelItem(level, visible, { levelItems, setLevelItems });
    },
    [levelItems, setLevelItems]
  );

  const handlePosClick = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const isUp = e.target.getAttribute("data-dir") === "up";
      const i = getLevelIndex(levelItems, level);
      if (i > 0 && isUp) {
        setLevelItems([
          ...levelItems.slice(0, i - 1),
          levelItems[i],
          levelItems[i - 1],
          ...levelItems.slice(i + 1),
        ]);
      } else if (i < levelItems.length - 1 && !isUp) {
        setLevelItems([
          ...levelItems.slice(0, i),
          levelItems[i + 1],
          levelItems[i],
          ...levelItems.slice(i + 2),
        ]);
      }
    },
    [levelItems, setLevelItems]
  );

  useEffect(() => {
    fixupLevelItems({
      shipmentsMode: shipmentsMode,
      levelItems,
      setLevelItems,
    });
  }, [shipmentsMode, levelItems, setLevelItems]);

  return (
    <div className="nest-mode-tool-panel">
      <h3>Levels</h3>
      <ul className="mode-list">
        {levelItems.map(({ level, visible }, i) => {
          const { enabled, upEnabled, downEnabled } = getLevelMeta(
            levelItems,
            i,
            { shipmentsMode: shipmentsMode }
          );

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
                  ▲
                </button>
                <button
                  data-level={level}
                  data-dir="down"
                  disabled={!downEnabled}
                  onClick={handlePosClick}
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <h3>Settings</h3>
      <h4>Grid Mode</h4>
      <ul className="settings-list">
        <li>
          <label>
            <input
              type="radio"
              checked={shipmentsMode === ShipmentsMode.BuildOrder}
              onChange={(e) =>
                e.target.checked && setShipmentsMode(ShipmentsMode.BuildOrder)
              }
            />
            Build Order
          </label>
          <section
            className=""
            aria-disabled={shipmentsMode !== ShipmentsMode.BuildOrder}
          ></section>
        </li>
        <li>
          <label>
            <input
              type="radio"
              checked={shipmentsMode === ShipmentsMode.LineItems}
              onChange={(e) =>
                e.target.checked && setShipmentsMode(ShipmentsMode.LineItems)
              }
            />
            Line Items
          </label>
          <section aria-disabled={shipmentsMode !== ShipmentsMode.LineItems}>
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isAllDeliveries}
                  disabled={shipmentsMode !== ShipmentsMode.LineItems}
                  onChange={(e) => setIsAllDeliveries(e.target.checked)}
                />
                All Deliveries
              </label>
            </div>
          </section>
        </li>
      </ul>

      <h3>Debug</h3>
      <DebugBox />
    </div>
  );
};
