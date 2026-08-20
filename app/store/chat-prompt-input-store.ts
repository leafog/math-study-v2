import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";
import type { LLMreasoning } from "~/lib/agent/types";

type CurrentModel = {
  id: string;
  config_name: string;
  model_name: string;
};

type ChatPromptInputState = {
  textInputValue: string;
  fileIds: string[];
  hasAny: boolean;
  currentModel: CurrentModel | null;
  reasoning: LLMreasoning;
};

type ChatPromptInputAction = {
  setTextInputValue: (input: string) => void;
  setCurrentModel: (model: CurrentModel) => void;
  setReasoning: (reasoning: LLMreasoning) => void;
  setFileIds: (ids: string[]) => void;
  addFileIds: (ids: string[]) => void;
  addFileId: (id: string) => void;

  removeFileId: (id: string) => void;
  clearFileIds: () => void;
  clearTextInput: () => void;
  reset: () => void;
};

const chatPromptInputStateDefault: ChatPromptInputState = {
  textInputValue: "",
  fileIds: [],
  hasAny: false,
  currentModel: null,
  reasoning: "none",
};

// 只要 textInput 或 fileIds 有值即为 true
const computeHasAnyCount = (
  textInputValue: string,
  fileIds: string[],
): boolean => textInputValue !== "" || fileIds.length > 0;

const chatPromptInputStoreCreator = (init: ChatPromptInputState) =>
  combine<ChatPromptInputState, ChatPromptInputAction>({ ...init }, (set) => ({
    setTextInputValue: (textInputValue) =>
      set((state) => ({
        textInputValue,
        hasAny: computeHasAnyCount(textInputValue, state.fileIds),
      })),
    setCurrentModel: (currentModel) => set({ currentModel }),
    setReasoning: (reasoning) => set({ reasoning }),
    setFileIds: (ids) =>
      set((state) => ({
        fileIds: ids,
        hasAny: computeHasAnyCount(state.textInputValue, ids),
      })),
    addFileIds: (ids) =>
      set((state) => {
        const fileIds = Array.from(new Set([...state.fileIds, ...ids]));
        return {
          fileIds,
          hasAny: computeHasAnyCount(state.textInputValue, fileIds),
        };
      }),
    addFileId: (id) =>
      set((state) => {
        if (state.fileIds.includes(id)) return state;
        const fileIds = [...state.fileIds, id];
        return {
          fileIds,
          hasAny: computeHasAnyCount(state.textInputValue, fileIds),
        };
      }),
    removeFileId: (id) =>
      set((state) => {
        const fileIds = state.fileIds.filter((fileId) => fileId !== id);
        return {
          fileIds,
          hasAny: computeHasAnyCount(state.textInputValue, fileIds),
        };
      }),
    clearFileIds: () =>
      set((state) => ({
        fileIds: [],
        hasAny: computeHasAnyCount(state.textInputValue, []),
      })),
    clearTextInput: () =>
      set((state) => ({
        textInputValue: "",
        hasAny: computeHasAnyCount("", state.fileIds),
      })),
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
    return newChatPromptInputStore;
  }
  let store = chatPromptInputStoreCache.get(chatId);
  if (!store) {
    store = createSelectors(
      create(
        persist(
          chatPromptInputStoreCreator(newChatPromptInputStore.getState()),
          {
            name: toKey(chatId),
            storage: createJSONStorage(() => tanstackDbStorage),
          },
        ),
      ),
    );
    chatPromptInputStoreCache.set(chatId, store);
  }
  return store;
};
