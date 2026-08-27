import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

type ChatNavState = {
  pinnedSort: string[];
  setPinnedSort: (orderedIds: string[]) => void;
};

export const useChatNavStore = createSelectors(
  create<ChatNavState>()(
    persist(
      (set) => ({
        pinnedSort: [],
        setPinnedSort: (orderedIds) => set({ pinnedSort: orderedIds }),
      }),
      {
        name: "chat-nav-store",
        storage: createJSONStorage(() => tanstackDbStorage),
      },
    ),
  ),
);
