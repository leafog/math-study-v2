import type { RefObject } from "react";

export function withRef<T>(ref: RefObject<T | null>, fn: (t: T) => void) {
  if (ref.current) {
    fn(ref.current);
  }
}

export function withRefs<R extends Record<string, RefObject<any>>>(
  refs: R,
  fn: (values: {
    [K in keyof R as K extends `${infer Name}Ref` ? Name : K]: NonNullable<
      R[K]["current"]
    >;
  }) => void,
): void {
  const entries = Object.entries(refs);

  // 只要有一个 ref 为空就直接返回
  if (entries.some(([, ref]) => !ref.current)) {
    return;
  }

  // 构建结果对象，key 去掉末尾的 'Ref'
  const values = {} as any;
  for (const [key, ref] of entries) {
    const strippedKey = key.endsWith("Ref") ? key.slice(0, -3) : key;
    values[strippedKey] = ref.current;
  }

  fn(values);
}
