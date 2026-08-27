import QuickLRU from "quick-lru";

/**
 * getOrPut 所需的最小容器接口。
 * Map 与 QuickLRU(QuickLRU extends Map)都满足该结构,无需额外适配。
 */
type StringKeyedCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): unknown;
};

/**
 * 取缓存;不存在则用 putFc 生成并写入。支持 putFc 返回 Promise:
 * 此时容器需持有 T | Promise<T>,并把 in-flight 的 promise 也缓存起来,
 * 并发调用会共享同一个 promise,避免重复初始化。
 *
 * 容器传 Map 或 QuickLRU 均可。
 */
export function getOrPut<T extends {}>(
  map: StringKeyedCache<T | Promise<T>>,
  key: string,
  putFc: () => T,
): T;

export function getOrPut<T extends {}>(
  map: StringKeyedCache<T | Promise<T>>,
  key: string,
  putFc: () => Promise<T>,
): Promise<T>;

export function getOrPut<T extends {}>(
  map: StringKeyedCache<T | Promise<T>>,
  key: string,
  putFc: () => T | Promise<T>,
): T | Promise<T> {
  const existing = map.get(key);
  if (existing !== undefined) return existing;
  const value = putFc();
  map.set(key, value);
  return value;
}

/**
 * 建一个 QuickLRU 缓存并把 getOrPut 绑上去:相比普通 Map 多了 LRU 淘汰。
 * onEviction 在条目被 LRU 压力 / TTL 淘汰前回调,可用来做副作用清理
 * (如 revokeObjectURL、停止 in-flight 的 Chat / stream 等)。
 *
 * @example
 * const { cache, getOrPut } = createLruGetOrPut({
 *   maxSize: 50,
 *   onEviction: (_key, value) => value.stop?.(),
 * });
 */
export function createLruGetOrPut<T extends {}>({
  maxSize,
  onEviction,
}: {
  maxSize: number;
  onEviction?: (key: string, value: T | Promise<T>) => void;
}) {
  const cache: QuickLRU<string, T | Promise<T>> = new QuickLRU({
    maxSize,
    onEviction,
  });
  return {
    cache,
    getOrPut: (key: string, putFc: () => T | Promise<T>) =>
      getOrPut(cache, key, putFc),
  };
}
