import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import i18n from "~/lib/i18n";
import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

type I18nState = {
  locale: string;
};

type I18nAction = {
  setLocale: (locale: string) => void;
};

const defaultState: I18nState = {
  locale: i18n.language ?? i18n.resolvedLanguage ?? "zh",
};

const store = create(
  persist(
    combine<I18nState, I18nAction>(defaultState, (set) => ({
      setLocale: (locale) => {
        set({ locale });
      },
    })),
    {
      name: "i18n-store",
      storage: createJSONStorage(() => tanstackDbStorage),
    },
  ),
);

export const useI18nStore = createSelectors(store);
