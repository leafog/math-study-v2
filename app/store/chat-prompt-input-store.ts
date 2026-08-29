import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import QuickLRU from "quick-lru";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";
import type { LLMreasoning } from "~/lib/agent/types";

type CurrentModel = {
  id: string;
  config_name: string;
  model_name: string;
};

export type AnnotationType = "svg" | "image";

export type Annotation = {
  /** 标注类型：svg 存 XML 字符串，image 存可直接渲染的图片 URL */
  type: AnnotationType;
  bounds: [minX: number, minY: number, maxX: number, maxY: number];
  text: string;
  /** svg 类型：XML 字符串 */
  svgXmlStr?: string;
  /** image 类型：可直接用于 <img src> 的 URL（data/blob） */
  imageUrl?: string;
};

type ChatPromptInputState = {
  textInputValue: string;
  fileIds: string[];
  hasAny: boolean;
  problemIds: string[];
  hasProblems: boolean;
  /** 按 toolId 隔离的标注：每个工具一份标注列表 */
  annotationsByTool: Record<string, Annotation[]>;
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

  /** 整体替换某个 tool 的标注 */
  setAnnotations: (toolId: string, annos: Annotation[]) => void;
  /** 往某个 tool 追加一条标注 */
  addAnnotation: (toolId: string, anno: Annotation) => void;
  /** 删除某个 tool 第 index 条标注 */
  removeAnnotation: (toolId: string, index: number) => void;
  /** 更新某个 tool 第 index 条标注（部分字段合并） */
  updateAnnotation: (
    toolId: string,
    index: number,
    anno: Partial<Annotation>,
  ) => void;
  /** 清空某个 tool 的标注；不传 toolId 时清空全部 */
  clearAnnotations: (toolId?: string) => void;

  reset: () => void;
};

const chatPromptInputStateDefault: ChatPromptInputState = {
  textInputValue: "",
  fileIds: [],
  hasAny: false,
  problemIds: [],
  annotationsByTool: {},
  hasProblems: false,
  currentModel: null,
  reasoning: "none",
};

// 只要有内容（文本 / 附件 / 题目）即为 true
const computeHasAny = (
  state: Pick<
    ChatPromptInputState,
    "textInputValue" | "fileIds" | "problemIds" | "annotationsByTool"
  >,
): boolean => {
  return (
    state.textInputValue !== "" ||
    state.fileIds.length > 0 ||
    state.problemIds.length > 0 ||
    Object.values(state.annotationsByTool).some((list) => list.length > 0)
  );
};

type ChatPromptInputStoreState = ChatPromptInputState & ChatPromptInputAction;

const chatPromptInputStoreCreator = (init: ChatPromptInputState) =>
  immer<ChatPromptInputStoreState>((set) => ({
    ...init,
    setTextInputValue: (textInputValue) =>
      set((state) => {
        state.textInputValue = textInputValue;
        state.hasAny = computeHasAny(state);
      }),
    setCurrentModel: (currentModel) =>
      set((state) => {
        state.currentModel = currentModel;
      }),
    setReasoning: (reasoning) =>
      set((state) => {
        state.reasoning = reasoning;
      }),
    setFileIds: (ids) =>
      set((state) => {
        state.fileIds = ids;
        state.hasAny = computeHasAny(state);
      }),
    addFileIds: (ids) =>
      set((state) => {
        const list = Array.isArray(ids) ? ids : [ids];
        state.fileIds = Array.from(new Set([...state.fileIds, ...list]));
        state.hasAny = computeHasAny(state);
      }),
    removeFileId: (id) =>
      set((state) => {
        state.fileIds = state.fileIds.filter((fileId) => fileId !== id);
        state.hasAny = computeHasAny(state);
      }),
    clearFileIds: () =>
      set((state) => {
        state.fileIds = [];
        state.hasAny = computeHasAny(state);
      }),
    clearTextInput: () =>
      set((state) => {
        state.textInputValue = "";
        state.hasAny = computeHasAny(state);
      }),
    addProblemIds: (ids) =>
      set((state) => {
        const list = Array.isArray(ids) ? ids : [ids];
        state.problemIds = Array.from(new Set([...state.problemIds, ...list]));
        state.hasProblems = state.problemIds.length > 0;
        state.hasAny = computeHasAny(state);
      }),
    removeProblemId: (id) =>
      set((state) => {
        state.problemIds = state.problemIds.filter((it) => it !== id);
        state.hasProblems = state.problemIds.length > 0;
        state.hasAny = computeHasAny(state);
      }),
    setProblemIds: (ids) =>
      set((state) => {
        state.problemIds = Array.from(new Set(ids));
        state.hasProblems = state.problemIds.length > 0;
        state.hasAny = computeHasAny(state);
      }),
    clearProblemIds: () =>
      set((state) => {
        state.problemIds = [];
        state.hasProblems = false;
        state.hasAny = computeHasAny(state);
      }),
    setAnnotations: (toolId, annos) =>
      set((state) => {
        state.annotationsByTool[toolId] = annos;
        state.hasAny = computeHasAny(state);
      }),
    addAnnotation: (toolId, anno) =>
      set((state) => {
        const list = state.annotationsByTool[toolId] ?? [];
        state.annotationsByTool[toolId] = [...list, anno];
        state.hasAny = computeHasAny(state);
      }),
    removeAnnotation: (toolId, index) =>
      set((state) => {
        const list = state.annotationsByTool[toolId] ?? [];
        const next = list.filter((_, i) => i !== index);
        // 删空后直接把 key 也删掉，避免残留空列表（isEmpty 才能判空）
        if (next.length === 0) {
          delete state.annotationsByTool[toolId];
        } else {
          state.annotationsByTool[toolId] = next;
        }
        state.hasAny = computeHasAny(state);
      }),
    updateAnnotation: (toolId, index, anno) =>
      set((state) => {
        const list = state.annotationsByTool[toolId] ?? [];
        state.annotationsByTool[toolId] = list.map((it, i) =>
          i === index ? { ...it, ...anno } : it,
        );
        state.hasAny = computeHasAny(state);
      }),
    clearAnnotations: (toolId) =>
      set((state) => {
        if (toolId) {
          state.annotationsByTool[toolId] = [];
        } else {
          state.annotationsByTool = {};
        }
        state.hasAny = computeHasAny(state);
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

// 会话草稿 store 的内存缓存：LRU 限制数量，防止无限增长。
// 数据仍在持久化存储里，被淘汰的 store 下次访问会按需重建。
const chatPromptInputStoreCache = new QuickLRU<string, ChatPromptInputStore>({
  maxSize: 50,
});
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
