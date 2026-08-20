import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

export type VisionModel = {
  id: string;
  config_name: string;
  model_name: string;
};

type ChatVisionModelState = {
  visionModel: VisionModel | null;
};

type ChatVisionModelAction = {
  setVisionModel: (model: VisionModel) => void;
};

const defaultState: ChatVisionModelState = {
  visionModel: null,
};

const store = create(
  persist(
    combine<ChatVisionModelState, ChatVisionModelAction>(
      defaultState,
      (set) => ({
        setVisionModel: (model) => set({ visionModel: model }),
      }),
    ),
    {
      name: "chat-vision-model",
      storage: createJSONStorage(() => tanstackDbStorage),
    },
  ),
);

export const useVisionModel = createSelectors(store);
