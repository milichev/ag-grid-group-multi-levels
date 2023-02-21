import React, { useCallback, useEffect } from "react";
import { DebugBox } from "./DebugBox";
import { useAppContext } from "../hooks/useAppContext";
import {
  fixupLevelItems,
  getLevelIndex,
  getLevelMeta,
  toggleLevelItem,
} from "../helpers/levels";
import { ShipmentsMode } from "../types";

export const LevelsToolPanel: React.FC = () => {
  const {
    levelItems,
    setLevelItems,
    shipmentsMode,
    setShipmentsMode,
    isAllDeliveries,
    setIsAllDeliveries,
    isFlattenSizes,
    setIsFlattenSizes,
    isLimitedSizes,
    setIsLimitedSizes,
    isUseSizeGroups,
    setIsUseSizeGroups,
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
      isFlattenSizes,
    });
  }, [shipmentsMode, levelItems, setLevelItems, isFlattenSizes]);

  return (
    <div className="nest-mode-tool-panel">
      <h3>Levels</h3>
      <ul className="mode-list">
        {levelItems.map(({ level }, i) => {
          const { checked, enabled, upEnabled, downEnabled } = getLevelMeta(
            levelItems,
            i,
            { shipmentsMode, isFlattenSizes }
          );

          return (
            <li key={level}>
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={checked}
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
      <h4>Shipments Mode</h4>
      <ul className="settings-list">
        <li>
          <label className="setting-label">
            <input
              type="radio"
              checked={shipmentsMode === ShipmentsMode.BuildOrder}
              onChange={(e) =>
                e.target.checked && setShipmentsMode(ShipmentsMode.BuildOrder)
              }
            />
            Build Order
            <div className="description">
              All items have the same shipments from the Build Order field, AND
              their individual shipments, if any.
            </div>
          </label>
          <section
            className=""
            aria-disabled={shipmentsMode !== ShipmentsMode.BuildOrder}
          ></section>
        </li>
        <li>
          <label className="setting-label">
            <input
              type="radio"
              checked={shipmentsMode === ShipmentsMode.LineItems}
              onChange={(e) =>
                e.target.checked && setShipmentsMode(ShipmentsMode.LineItems)
              }
            />
            Line Items
            <div className="description">Each item has its own shipments.</div>
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

      <h4>Sizes</h4>
      <ul className="settings-list">
        <li>
          <label className="setting-label">
            <input
              type="checkbox"
              checked={isFlattenSizes}
              onChange={(e) => setIsFlattenSizes(e.target.checked)}
            />
            Flatten All Sizes
            <div className="description">
              Columns for all sizes of all products are displayed at the same
              level.
            </div>
          </label>
        </li>
        <li>
          <label className="setting-label">
            <input
              type="checkbox"
              checked={isLimitedSizes}
              onChange={(e) => setIsLimitedSizes(e.target.checked)}
            />
            Limited Sizes
            <div className="description">
              Suppose this brand uses a strict set of sizes for all products.
            </div>
          </label>
        </li>
        <li>
          <label className="setting-label">
            <input
              type="checkbox"
              checked={isUseSizeGroups}
              onChange={(e) => setIsUseSizeGroups(e.target.checked)}
            />
            Use Size Groups
          </label>
        </li>
      </ul>

      <h3>Debug</h3>
      <DebugBox />
    </div>
  );
};
