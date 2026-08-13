export function getOrPut<T extends {}>(
  map: Map<string, T>,
  key: string,
  putFc: () => T,
): T {
  if (!map.has(key)) {
    map.set(key, putFc());
  }
  return map.get(key)!;
}
