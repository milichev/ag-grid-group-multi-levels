import React, { useCallback, useEffect, useRef } from "react";
import { CONTEXT_PREFIX, nuPerf } from "../helpers/perf";

export const DebugBox = () => {
  const pre = useRef<HTMLUListElement>(null);

  const onContextUpdate = useCallback((ctx) => {
    if (pre.current) {
      performance?.mark?.("DebugBox.onContextUpdate");
      pre.current.innerHTML = Object.entries(ctx)
        .sort(([a], [b]) => {
          const perfA = a.startsWith(CONTEXT_PREFIX);
          const perfB = b.startsWith(CONTEXT_PREFIX);
          return perfA && !perfB
            ? 1
            : !perfA && perfB
            ? -1
            : a.localeCompare(b, "en", { ignorePunctuation: true });
        })
        .map(([k, v]) => {
          let liClass = "";
          if (k.startsWith(CONTEXT_PREFIX)) {
            liClass = `perf ${
              v < 5 ? "fast" : v < 75 ? "so-so" : v < 1000 ? "slow" : "dead"
            }`;
          }
          return `<li class="${liClass}"><span class="label">${k}</span> <span class="value">${v}</span></li>`;
        })
        .join("\n");
    }
  }, []);

  const handleEvent = useCallback((e: MouseEvent) => {
    let li = e.target as HTMLElement;
    li = li.closest(".debug-list>li");
    if (li && e.type === "dblclick") {
      if (e.metaKey) {
        nuPerf.setContext({}, false);
      } else {
        pre.current.removeChild(li);
        const key = li.querySelector(".label")?.textContent;
        key && nuPerf.clearContext(key);
      }
    }
  }, []);

  useEffect(() => {
    nuPerf.addOnContext(onContextUpdate);
    const events: (keyof HTMLElementEventMap)[] = ["dblclick"];
    const { current } = pre;
    events.forEach((e) => current?.addEventListener(e, handleEvent));

    return () => {
      nuPerf.removeOnContext(onContextUpdate);
      events.forEach((e) => current?.removeEventListener(e, handleEvent));
    };
  }, [handleEvent, onContextUpdate]);

  return <ul className="debug-list" ref={pre} />;
};
