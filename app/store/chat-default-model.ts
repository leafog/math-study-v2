import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

export type DefaultModel = {
  id: string;
  config_name: string;
  model_name: string;
};

type ChatDefaultModelState = {
  defaultModel: DefaultModel | null;
};

type ChatDefaultModelAction = {
  setDefaultModel: (model: DefaultModel) => void;
};

const defaultState: ChatDefaultModelState = {
  defaultModel: null,
};

const store = create(
  persist(
    combine<ChatDefaultModelState, ChatDefaultModelAction>(
      defaultState,
      (set) => ({
        setDefaultModel: (model) => set({ defaultModel: model }),
      }),
    ),
    {
      name: "chat-default-model",
      storage: createJSONStorage(() => tanstackDbStorage),
    },
  ),
);

export const useChatDefaultModel = createSelectors(store);
