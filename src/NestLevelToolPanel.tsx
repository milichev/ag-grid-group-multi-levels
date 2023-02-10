import React, { useCallback, useEffect } from "react";
import "./styles.css";
import { DebugBox } from "./DebugBox";
import { useAppContext } from "./appContext";
import { Level, NestLevelItem } from "./interfaces";

const getLevelIndex = (levelItems: NestLevelItem[], level: Level) =>
  levelItems.findIndex((item) => item.level === level);

export const NestLevelToolPanel: React.FC = () => {
  const { levelItems, setLevelItems, isBuildOrder, setIsBuildOrder } =
    useAppContext();

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
    if (!isBuildOrder) {
      const baseIndex = Math.max(
        getLevelIndex(levelItems, "product"),
        getLevelIndex(levelItems, "warehouse")
      );
      const shipmentIndex = getLevelIndex(levelItems, "shipment");
      if (baseIndex > shipmentIndex) {
        const reordered = [...levelItems];
        const [shipmentItem] = reordered.splice(shipmentIndex, 1);
        reordered.splice(baseIndex, 0, shipmentItem);
        setLevelItems(reordered);
      }
    }
  }, [isBuildOrder, levelItems, setLevelItems]);

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
                downEnabled &&
                levelItems[i + 1].level !== "sizeGroup" &&
                (isBuildOrder || levelItems[i + 1].level !== "shipment");
              break;
            case "warehouse":
              downEnabled =
                downEnabled &&
                (isBuildOrder || levelItems[i + 1].level !== "shipment");
              break;
            case "sizeGroup":
              upEnabled = upEnabled && levelItems[i - 1].level !== "product";
              break;
            case "shipment":
              upEnabled =
                upEnabled &&
                (isBuildOrder ||
                  (levelItems[i - 1].level !== "product" &&
                    levelItems[i - 1].level !== "warehouse"));
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
      <h3>Settings</h3>
      <ul className="settings-list">
        <li>
          <label>
            <input
              type="checkbox"
              checked={isBuildOrder}
              onChange={(e) => setIsBuildOrder(e.target.checked)}
            />
            Build Order
          </label>
        </li>
      </ul>
      <h3>Debug</h3>
      <DebugBox />
    </div>
  );
};
