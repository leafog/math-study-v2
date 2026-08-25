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
  problemIds: string[];
  hasProblems: boolean;
  currentModel: CurrentModel | null;
  reasoning: LLMreasoning;
};

type ChatPromptInputAction = {
  setTextInputValue: (input: string) => void;
  setCurrentModel: (model: CurrentModel) => void;
  setReasoning: (reasoning: LLMreasoning) => void;

  setFileIds: (ids: string[]) => void;
  addFileIds: (ids: string | string[]) => void;
  removeFileId: (id: string) => void;
  clearFileIds: () => void;
  clearTextInput: () => void;

  setProblemIds: (ids: string[]) => void;
  addProblemIds: (ids: string | string[]) => void;
  removeProblemId: (id: string) => void;
  clearProblemIds: () => void;
  reset: () => void;
};

const chatPromptInputStateDefault: ChatPromptInputState = {
  textInputValue: "",
  fileIds: [],
  hasAny: false,
  problemIds: [],
  hasProblems: false,
  currentModel: null,
  reasoning: "none",
};

// 只要有内容（文本 / 附件 / 题目）即为 true
const computeHasAny = (
  state: Pick<
    ChatPromptInputState,
    "textInputValue" | "fileIds" | "problemIds"
  >,
): boolean =>
  state.textInputValue !== "" ||
  state.fileIds.length > 0 ||
  state.problemIds.length > 0;

const chatPromptInputStoreCreator = (init: ChatPromptInputState) =>
  combine<ChatPromptInputState, ChatPromptInputAction>({ ...init }, (set) => ({
    setTextInputValue: (textInputValue) =>
      set((state) => ({
        textInputValue,
        hasAny: computeHasAny(state),
      })),
    setCurrentModel: (currentModel) => set({ currentModel }),
    setReasoning: (reasoning) => set({ reasoning }),
    setFileIds: (ids) =>
      set((state) => {
        const fileIds = ids;
        return { fileIds, hasAny: computeHasAny({ ...state, fileIds }) };
      }),
    addFileIds: (ids) =>
      set((state) => {
        const list = Array.isArray(ids) ? ids : [ids];
        const fileIds = Array.from(new Set([...state.fileIds, ...list]));
        return { fileIds, hasAny: computeHasAny({ ...state, fileIds }) };
      }),
    removeFileId: (id) =>
      set((state) => {
        const fileIds = state.fileIds.filter((fileId) => fileId !== id);
        return { fileIds, hasAny: computeHasAny({ ...state, fileIds }) };
      }),
    clearFileIds: () =>
      set((state) => {
        const fileIds: string[] = [];
        return { fileIds, hasAny: computeHasAny({ ...state, fileIds }) };
      }),
    clearTextInput: () =>
      set((state) => {
        const textInputValue = "";
        return {
          textInputValue,
          hasAny: computeHasAny({ ...state, textInputValue }),
        };
      }),
    addProblemIds: (ids) =>
      set((state) => {
        const list = Array.isArray(ids) ? ids : [ids];
        const problemIds = Array.from(new Set([...state.problemIds, ...list]));
        return {
          problemIds,
          hasProblems: problemIds.length > 0,
          hasAny: computeHasAny({ ...state, problemIds }),
        };
      }),
    removeProblemId: (id) =>
      set((state) => {
        const problemIds = state.problemIds.filter((it) => it !== id);
        return {
          problemIds,
          hasProblems: problemIds.length > 0,
          hasAny: computeHasAny({ ...state, problemIds }),
        };
      }),
    setProblemIds: (ids) =>
      set((state) => {
        const problemIds = Array.from(new Set(ids));
        return {
          problemIds,
          hasProblems: problemIds.length > 0,
          hasAny: computeHasAny({ ...state, problemIds }),
        };
      }),
    clearProblemIds: () =>
      set((state) => {
        const problemIds: string[] = [];
        return {
          problemIds,
          hasProblems: false,
          hasAny: computeHasAny({ ...state, problemIds }),
        };
      }),
    reset: () => set(chatPromptInputStateDefault),
  }));

// problemIds 挂在 prompt input 状态里，随草稿一起持久化：切换会话/新会话后恢复。
// 只存 id，完整题目内容在渲染/发送时按 id 从库中查询。
const persistPartialize = (
  state: ChatPromptInputState & ChatPromptInputAction,
) => {
  const { ...rest } = state;
  return rest;
};

const newChatPromptInputStoreName = "chat-prompt-input-store-new";

export const newChatPromptInputStore = createSelectors(
  create(
    persist(chatPromptInputStoreCreator(chatPromptInputStateDefault), {
      name: newChatPromptInputStoreName,
      storage: createJSONStorage(() => sessionStorage),
      partialize: persistPartialize,
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
            partialize: persistPartialize,
          },
        ),
      ),
    );
    chatPromptInputStoreCache.set(chatId, store);
  }
  return store;
};
