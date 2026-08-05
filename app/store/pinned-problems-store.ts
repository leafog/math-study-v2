import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSelectors } from "./create-selectors";

type PinnedState = {
  pinned: Record<string, string>;
  toggle: (chatId: string, problemId: string) => void;
  isPinned: (chatId: string, problemId: string) => boolean;
};

export const usePinnedProblems = createSelectors(
  create<PinnedState>()(
    persist(
      (set, get) => ({
        pinned: {},
        toggle: (chatId, problemId) => {
          set((s) => {
            const current = s.pinned[chatId];
            const next = current === problemId ? undefined : problemId;
            const { [chatId]: _, ...rest } = s.pinned;
            return next
              ? { pinned: { ...rest, [chatId]: next } }
              : { pinned: rest };
          });
        },
        isPinned: (chatId, problemId) => {
          return get().pinned[chatId] === problemId;
        },
      }),
      {
        name: "pinned-problems",
        storage: createJSONStorage(() => sessionStorage),
      },
    ),
  ),
);
