import { useEffect, useState } from "react";
import type { Mutate, StoreApi } from "zustand";

type StoreWithPersist<T> = Mutate<StoreApi<T>, [["zustand/persist", unknown]]>;

export function useHydrated<T>(store: StoreWithPersist<T>): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubHydrate = store.persist.onHydrate(() => {
      setHydrated(false);
    });

    const unsubFinishHydration = store.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // 防止已经 hydrate 完成才 mount 的情况
    setHydrated(store.persist.hasHydrated());

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, [store]);

  return hydrated;
}
