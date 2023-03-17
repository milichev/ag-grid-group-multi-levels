import { RefObject, useEffect } from "react";

export const useContainerEvents = (container: RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const owner = container?.current;

    const handleClick = (e: MouseEvent) => {
      const menuButton = e.target as HTMLSpanElement;
      if (
        !menuButton?.matches(".ag-group-cell-inner .ag-group-cell-menu-button")
      ) {
        return;
      }

      const elemRect = menuButton.getBoundingClientRect();
      const { height, width } = elemRect;
      let { left, top } = elemRect;
      top += height / 2;
      left += width / 2;

      const evt = new MouseEvent("contextmenu", {
        bubbles: true,
        button: 2,
        cancelable: true,
        view: menuButton.ownerDocument.defaultView,
        detail: 1,
        screenX: left,
        screenY: top,
        clientX: left,
        clientY: top,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false,
        relatedTarget: null,
      });

      return !menuButton.dispatchEvent(evt);
    };

    owner?.addEventListener("click", handleClick, {
      capture: true,
    });

    return () => {
      owner?.removeEventListener("click", handleClick, {
        capture: true,
      });
    };
  }, [container]);
};
