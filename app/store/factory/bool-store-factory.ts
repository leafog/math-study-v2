import { create } from "zustand";
import { createSelectors } from "../create-selectors";

type BooleanStore = {
  value: boolean;
  set: (value: boolean) => void;
  toggle: () => void;
  on: () => void;
  off: () => void;
};

export const createBooleanStore = (initial = false) => {
  return createSelectors(
    create<BooleanStore>((set) => ({
      value: initial,
      set: (value) => set({ value }),
      toggle: () =>
        set((state) => ({
          value: !state.value,
        })),
      on: () => set({ value: true }),
      off: () => set({ value: false }),
    })),
  );
};
