import { create } from "zustand";
import { createSelectors } from "./create-selectors";

interface ChatIdState {
  chatId: string;
  newChatId: string;
  setChatId: (id: string) => void;
  setNewChatId: (id: string) => void;
  resetNewChatId: () => void;
}

const chatIdStore = create<ChatIdState>((set) => ({
  chatId: "",
  newChatId: "",
  setChatId: (chatId) => set({ chatId }),
  setNewChatId: (newChatId) => set({ newChatId }),
  resetNewChatId: () => set({ newChatId: "" }),
}));
const useChatId = createSelectors(chatIdStore);
export { chatIdStore, useChatId };
