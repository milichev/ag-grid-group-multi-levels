import _ from "lodash";
import { afterFrame } from "./afterFrame";
import { getGridData } from "../data/getFake";

const outPrefix = "[nu.perf]";
const global: any = window;

class PerfArray<T = any> extends Array<T> {}

(
  ["filter", "groupBy", "sum", "sumBy", "map", "find"] as (keyof typeof _)[]
).forEach((name) => {
  const method = _[name] as AnyFunction;
  PerfArray.prototype[name] = function (this: PerfArray, ...args: any) {
    return toPerfArray(method(this, ...args));
  };
});

const objProps = ["entries", 'mapKeys", "mapValues"'].reduce((acc, meth) => {
  acc[meth] = {
    enumerable: false,
    value: function (this: Record<string, unknown>, ...args: any[]) {
      return toPerfArray(_[meth](this, ...args));
    },
  };
  return acc;
}, {} as PropertyDescriptorMap);

function toPerfArray(obj) {
  if (Array.isArray(obj)) {
    return obj instanceof PerfArray
      ? obj
      : PerfArray.of(...obj.map(toPerfArray));
  }
  if (_.isPlainObject(obj)) {
    return obj instanceof PerformanceEntry ||
      (typeof obj.componentName === "string" &&
        typeof obj.duration === "number")
      ? obj
      : extObject(_.mapValues(obj, toPerfArray));
  }
  return obj;
}

function extObject(obj) {
  return Object.defineProperties(obj, objProps);
}

export let context = {};

export const CONTEXT_PREFIX = "perf:";

const createNuPerf = () => {
  let entries: PerformanceEntry[] = new PerfArray();

  function onEntry(entry: PerformanceEntry) {
    entries.push(entry);
  }

  function flush() {
    let byType: { [entryType: string]: PerformanceEntry[] } = extObject({});

    const addByType = (entry: PerformanceEntry, entryType = entry.entryType) =>
      (byType[entryType] || (byType[entryType] = new PerfArray())).push(entry);

    entries.forEach((entry) => {
      addByType(entry);
    });

    const dump = {
      ...context,
      entries,
      byType,
    };

    global.__nu_perf_dump = dump;
    console.info(outPrefix, dump);

    entries = new PerfArray();

    byType = {};
  }

  type OnContext = <C>(ctx: C) => void;
  const contextHandlers = new Set<OnContext>();

  let onContextIdle = 0;
  const onContext = _.debounce(() => {
    cancelIdleCallback(onContextIdle);
    onContextIdle = window.requestIdleCallback(() => {
      contextHandlers.forEach((h) => h(context));
    });
  }, 5);

  const setContext = <C extends Record<string, unknown>>(
    ctx: C,
    append = true
  ) => {
    if (ctx && typeof ctx === "object") {
      context = append ? { ...context, ...ctx } : { ...ctx };
    }
    onContext();
  };

  return {
    onEntry,
    flush,
    setContext,
    addOnContext(handler: OnContext) {
      contextHandlers.add(handler);
      handler(context);
    },
    removeOnContext(handler: OnContext) {
      contextHandlers.delete(handler);
    },
    clearContext(pattern: string | RegExp) {
      Object.keys(context).forEach((key) => {
        if (
          (typeof pattern === "string" && key.includes(pattern)) ||
          !!key.match(pattern)
        ) {
          delete context[key];
        }
      });
    },
  };
};

const createStep = (
  name: string,
  startMark: string,
  endMark: string,
  async: boolean
) => {
  const startMs = performance?.now?.();
  performance?.mark?.(startMark);

  return {
    name,
    startMark,
    endMark,
    startMs,
    finish: (...args: any[]) => {
      const cb = () => {
        const endMs = performance.now();
        performance?.mark?.(endMark);
        performance?.measure?.(name, startMark, endMark);
        steps.delete(name);
        const elapsed = (endMs - startMs).toFixed(3);
        console.log(`${outPrefix} END ${name} (${elapsed})`, ...args);
        nuPerf.setContext({ [`${CONTEXT_PREFIX}${name}`]: elapsed }, true);
      };

      if (async) {
        afterFrame(cb);
      } else {
        cb();
      }
    },
  };
};

type MeasureStep = ReturnType<typeof createStep>;
const steps = new Map<string, MeasureStep>();

export const measureStep = ({
  name,
  startMark = `${name}_START`,
  endMark = `${name}_END`,
  async = true,
  suppressExistWarning = false,
}: {
  name: string;
  startMark?: string;
  endMark?: string;
  suppressExistWarning?: boolean;
  /** Finishing the measurement is deferred to the closest free frame */
  async?: boolean;
}) => {
  let step = steps.get(name);
  if (step) {
    suppressExistWarning &&
      console.warn(
        `${outPrefix} multiple measureStep starts without finish: ${name}`
      );
  } else {
    step = createStep(name, startMark, endMark, async);
    steps.set(name, step);
  }
  return step;
};

export const measureAction = <F extends AnyFunction>(
  action: F,
  name = action.name
): ReturnType<F> => {
  const step = measureStep({ name, async: false });
  let result: ReturnType<F>;
  try {
    result = action();
  } finally {
    step.finish(result);
  }
  return result;
};

export const getStep = (name: string, suppressMissingWarning = false) => {
  const step: MeasureStep | undefined = steps.get(name);
  if (!step && !suppressMissingWarning) {
    console.warn(`${outPrefix} no such step has been started: ${name}`);
  }
  return step;
};

export const wrap = <F extends (...args: any[]) => any>(
  fn: F,
  name: string,
  async = true
): F =>
  function (this: ThisType<F>, ...args: Parameters<F>) {
    const step = measureStep({ name: name as string, async });
    let result = fn.call(this, ...args);

    if (async && result?.then && _.isFunction(result.then)) {
      result = result.then((resolved) => {
        step.finish(resolved);
        return resolved;
      });
    } else {
      step.finish(result);
    }

    return result;
  } as F;

export const wrapObj = <T extends Record<string | number | symbol, any>>(
  obj: T,
  prefix = ""
) => _.mapValues(obj, (f, key) => wrap(f, `${prefix}${key}`, false)) as T;

export const nuPerf = /*(top as any).__nu_perf ??*/ createNuPerf();
global.__nu_perf = nuPerf;
// (top as any).__nu_perf_dump = null;

const observer = new window.PerformanceObserver((list) =>
  list.getEntries().forEach(nuPerf.onEntry)
);

observer.observe({
  entryTypes: [
    // "element",
    // "event",
    // "first-input",
    // "largest-contentful-paint",
    // "layout-shift",
    // "longtask",
    // "mark",
    "measure",
    // "navigation",
    // "paint",
    // "resource",
  ],
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.altKey) {
    switch (e.code) {
      // Ctrl+Shift+Option+F
      case "KeyF":
        nuPerf.flush();
        break;
    }
  }
});
