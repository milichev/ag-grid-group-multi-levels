import React, { useCallback, useEffect, useRef } from "react";
import { nuPerf } from "./perf";

export const DebugBox = () => {
  const pre = useRef<HTMLPreElement>(null);

  const onContextUpdate = useCallback((ctx) => {
    if (pre.current)
      pre.current.innerHTML = Object.entries(ctx)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
  }, []);

  useEffect(() => {
    nuPerf.addOnContext(onContextUpdate);
    return () => nuPerf.removeOnContext(onContextUpdate);
  }, [onContextUpdate]);

  return <pre ref={pre} />;
};
