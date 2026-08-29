import type { StoreApi, UseBoundStore } from "zustand";

/**
 * 给 store 的每个字段生成 use 选择器。
 * 不传 selector 返回字段完整值；传 selector 则对字段值做投影。
 * 用两个调用签名(重载)表达:无参 → T[K]，有参 → 选择结果 U。
 */
export type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & {
      use: {
        [K in keyof T]: {
          (): T[K];
          <U>(selector: (value: T[K]) => U): U;
        };
      };
    }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = (selector?: (value: any) => any) =>
      selector
        ? store((s) => selector(s[k as keyof typeof s]))
        : store((s) => s[k as keyof typeof s]);
  }
  return store;
};
