/**
 * 取缓存;不存在则用 putFc 生成并写入。支持 putFc 返回 Promise:
 * 此时 map 需持有 T | Promise<T>,并把 in-flight 的 promise 也缓存起来,
 * 并发调用会共享同一个 promise,避免重复初始化。
 */
export function getOrPut<T extends {}>(
  map: Map<string, T | Promise<T>>,
  key: string,
  putFc: () => T,
): T;

export function getOrPut<T extends {}>(
  map: Map<string, T | Promise<T>>,
  key: string,
  putFc: () => Promise<T>,
): Promise<T>;

export function getOrPut<T extends {}>(
  map: Map<string, T | Promise<T>>,
  key: string,
  putFc: () => T | Promise<T>,
): T | Promise<T> {
  const existing = map.get(key);
  if (existing !== undefined) return existing;
  const value = putFc();
  map.set(key, value);
  return value;
}
