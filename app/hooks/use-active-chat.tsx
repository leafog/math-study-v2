import { create } from "zustand";

type ActiveChatState = {
  chatId: string | undefined;
};
type ActiveChatActions = {
  updateChatId: (chatId: string | undefined) => void;
};
type ActiveChatStore = ActiveChatState & ActiveChatActions;

export const useActiveChatState = create<ActiveChatStore>((set) => ({
  chatId: undefined,
  updateChatId: (next) => set({ chatId: next }),
}));
