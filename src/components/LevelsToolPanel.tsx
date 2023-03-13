import React, { memo, useCallback, useEffect } from "react";
import { DebugBox } from "./DebugBox";
import { useSizeGridContext } from "../hooks/useSizeGridContext";
import {
  fixupLevelItems,
  getLevelItemIndex,
  getLevelItemIndices,
  getLevelMeta,
  toggleLevelItem,
} from "../data/levels";
import { ShipmentsMode } from "../data/types";
import { gaEvents } from "../helpers/ga";

export const LevelsToolPanel: React.FC = memo(() => {
  const {
    levelItems,
    shipmentsMode,
    isAllDeliveries,
    isFlattenSizes,
    isLimitedSizes,
    isUseSizeGroups,
    dispatch,
  } = useSizeGridContext();

  const handleVisibleChange = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const visible = e.target.checked;
      toggleLevelItem(level, visible, { levelItems, dispatch });
      gaEvents.toggleLevel(level, visible);
    },
    [dispatch, levelItems]
  );

  const handlePosClick = useCallback(
    (e) => {
      const level = e.target.getAttribute("data-level");
      const isUp = e.target.getAttribute("data-dir") === "up";
      const i = getLevelItemIndex(levelItems, level);
      if (i > 0 && isUp) {
        dispatch({
          prop: "levelItems",
          payload: [
            ...levelItems.slice(0, i - 1),
            levelItems[i],
            levelItems[i - 1],
            ...levelItems.slice(i + 1),
          ],
        });
      } else if (i < levelItems.length - 1 && !isUp) {
        dispatch({
          prop: "levelItems",
          payload: [
            ...levelItems.slice(0, i),
            levelItems[i + 1],
            levelItems[i],
            ...levelItems.slice(i + 2),
          ],
        });
      }
    },
    [dispatch, levelItems]
  );

  useEffect(() => {
    fixupLevelItems({
      levelItems,
      isFlattenSizes,
      isUseSizeGroups,
      dispatch,
    });
  }, [shipmentsMode, levelItems, isFlattenSizes, dispatch, isUseSizeGroups]);

  const levelItemIndices = getLevelItemIndices(levelItems);

  return (
    <div className="nest-mode-tool-panel">
      <h3>Levels</h3>
      <ul className="mode-list">
        {levelItems.map(({ level }, i) => {
          const { checked, enabled, upEnabled, downEnabled } = getLevelMeta(
            levelItems,
            i,
            levelItemIndices,
            { shipmentsMode, isFlattenSizes, isUseSizeGroups }
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
                e.target.checked &&
                dispatch({
                  prop: "shipmentsMode",
                  payload: ShipmentsMode.BuildOrder,
                })
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
                e.target.checked &&
                dispatch({
                  prop: "shipmentsMode",
                  payload: ShipmentsMode.LineItems,
                })
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
                  onChange={(e) =>
                    dispatch({
                      prop: "isAllDeliveries",
                      payload: e.target.checked,
                    })
                  }
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
              onChange={(e) =>
                dispatch({
                  prop: "isFlattenSizes",
                  payload: e.target.checked,
                })
              }
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
              onChange={(e) =>
                dispatch({
                  prop: "isLimitedSizes",
                  payload: e.target.checked,
                })
              }
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
              onChange={(e) =>
                dispatch({
                  prop: "isUseSizeGroups",
                  payload: e.target.checked,
                })
              }
            />
            Use Size Groups
          </label>
        </li>
      </ul>

      <h3>Debug</h3>
      <DebugBox />
    </div>
  );
});
