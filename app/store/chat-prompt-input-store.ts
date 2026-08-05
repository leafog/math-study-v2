import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

type ChatPromptInputState = {
  textInputValue: string;
  pushToTextInputValue: string;
};

type ChatPromptInputAction = {
  setTextInputValue: (input: string) => void;
  clearTextInput: () => void;
  setPushToTextInputValue: (input: string) => void;
  reset: () => void;
};

const chatPromptInputStateDefault: ChatPromptInputState = {
  textInputValue: "",
  pushToTextInputValue: "",
};

const chatPromptInputStoreCreator = (init: ChatPromptInputState) =>
  combine<ChatPromptInputState, ChatPromptInputAction>({ ...init }, (set) => ({
    setTextInputValue: (input) => set({ textInputValue: input }),
    setPushToTextInputValue: (input) => set({ pushToTextInputValue: input }),
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
