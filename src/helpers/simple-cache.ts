const _cache = new Map<string, any>();

export const resolveCached = <T>(
  key: string,
  get: () => T,
  validate?: (cached: T) => boolean
): T => {
  let value: T;
  if (_cache.has(key)) {
    value = _cache.get(key);
    if (!validate || validate(value)) {
      return value;
    }
  }

  value = get();
  _cache.set(key, value);
  return value;
};
