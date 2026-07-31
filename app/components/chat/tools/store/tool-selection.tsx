import { create } from "zustand";
import { createSelectors } from "~/store/create-selectors";

export type ToolSelectionItem = {
  id: string;
  kind: string;
  content: string;
  type: "markdown";
};

export type ToolSelectionState = {
  selectsMap: Record<string, ToolSelectionItem>;
};

type ToolSelectionAction = {
  /** 设置某个工具的选区 */
  setSelection: (item: ToolSelectionItem) => void;
  /** 清除某个工具的选区 */
  clearSelection: (id: string) => void;
  /** 获取某个工具的选区 */
  getSelection: (id: string) => ToolSelectionItem | undefined;
};

export const useToolSelectionStore = createSelectors(
  create<ToolSelectionState & ToolSelectionAction>((set, get) => ({
    selectsMap: {},

    setSelection: (item) =>
      set((s) => ({
        selectsMap: { ...s.selectsMap, [item.id]: item },
      })),

    clearSelection: (id) =>
      set((s) => {
        const next = { ...s.selectsMap };
        delete next[id];
        return { selectsMap: next };
      }),

    getSelection: (id) => get().selectsMap[id],
  })),
);
