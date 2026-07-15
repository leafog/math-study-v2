import { queryOnce, eq } from "@tanstack/react-db";
import type { StateStorage } from "zustand/middleware";
import { zustandStorageColl } from "~/db/tdb-collections";

export const tanstackDbStorage: StateStorage = {
  getItem: async (id) => {
    const data = await queryOnce((q) =>
      q
        .from({ zustandStorageColl })
        .where(({ zustandStorageColl }) => eq(zustandStorageColl.id, id))
        .findOne()
        .select(({ zustandStorageColl }) => ({
          value: zustandStorageColl.value,
        })),
    );
    return data?.value ?? null;
  },
  setItem: async (id, value) => {
    const existing = zustandStorageColl.get(id);
    if (existing) {
      zustandStorageColl.update(existing.id, (draft) => {
        draft.value = value;
        draft.updatedAt = new Date();
      });
    } else {
      zustandStorageColl.insert({
        id,
        value,
        updatedAt: new Date(),
      });
    }
  },
  removeItem: (id) => {
    zustandStorageColl.delete(id);
  },
};
