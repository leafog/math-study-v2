import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

type CurrentModel = {
  id: string;
  config_name: string;
  model_name: string;
};

type ChatPromptInputState = {
  textInputValue: string;
  currentModel: CurrentModel | null;
};

type ChatPromptInputAction = {
  setTextInputValue: (input: string) => void;
  setCurrentModel: (model: CurrentModel) => void;
  clearTextInput: () => void;
  reset: () => void;
};

const chatPromptInputStateDefault: ChatPromptInputState = {
  textInputValue: "",
  currentModel: null,
};

const chatPromptInputStoreCreator = (init: ChatPromptInputState) =>
  combine<ChatPromptInputState, ChatPromptInputAction>({ ...init }, (set) => ({
    setTextInputValue: (input) => set({ textInputValue: input }),
    setCurrentModel: (model) => set({ currentModel: model }),
    clearTextInput: () => set({ textInputValue: "" }),
    reset: () => set(chatPromptInputStateDefault),
  }));

const newChatPromptInputStoreName = "chat-prompt-input-store-new";

const newChatPromptInputStore = createSelectors(
  create(
    persist(chatPromptInputStoreCreator(chatPromptInputStateDefault), {
      name: newChatPromptInputStoreName,
      storage: createJSONStorage(() => sessionStorage),
    }),
  ),
);

export type ChatPromptInputStore = typeof newChatPromptInputStore;

const chatPromptInputStoreCache = new Map<string, ChatPromptInputStore>();
export const toKey = (chatId: string) => `chat-prompt-input-store-${chatId}`;
export const createChatPromptInputStore = (
  isNewChat: boolean,
  chatId: string,
): ChatPromptInputStore => {
  if (isNewChat) {
    newChatPromptInputStore.getState().reset();
    return newChatPromptInputStore;
  }
  let store = chatPromptInputStoreCache.get(chatId);
  if (!store) {
    store = createSelectors(
      create(
        persist(chatPromptInputStoreCreator(chatPromptInputStateDefault), {
          name: toKey(chatId),
          storage: createJSONStorage(() => tanstackDbStorage),
        }),
      ),
    );
    chatPromptInputStoreCache.set(chatId, store);
  }
  return store;
};
