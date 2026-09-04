import { useEffect, useRef } from "react";

/**
 * 把外部值同步进内部状态，但只在外部值真正变化时才触发。
 * 避免每次 render 都无条件 setInternal 造成的多余更新 / 循环。
 */
export function useSync<T>(externalValue: T, setInternal: (value: T) => void) {
  const prevValueRef = useRef(externalValue);

  useEffect(() => {
    // 只有外部值真的变了，才同步到内部
    if (externalValue !== prevValueRef.current) {
      prevValueRef.current = externalValue;
      setInternal(externalValue);
    }
  }, [externalValue, setInternal]);
}
