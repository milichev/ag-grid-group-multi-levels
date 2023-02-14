import React, { useCallback, useEffect, useRef } from "react";
import { CONTEXT_PREFIX, nuPerf } from "../helpers/perf";

export const DebugBox = () => {
  const pre = useRef<HTMLUListElement>(null);

  const onContextUpdate = useCallback((ctx) => {
    if (pre.current) {
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
          return `<li class="${liClass}"><span class="label">${k}:</span> <span class="value">${v}</span></li>`;
        })
        .join("\n");
    }
  }, []);

  useEffect(() => {
    nuPerf.addOnContext(onContextUpdate);
    return () => nuPerf.removeOnContext(onContextUpdate);
  }, [onContextUpdate]);

  return <ul className="debug-list" ref={pre} />;
};
