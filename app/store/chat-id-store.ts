import { create } from "zustand";
import { createSelectors } from "./create-selectors";
import { genId } from "~/lib/id-utils";

interface ChatIdState {
  chatId: string;
  newChatId: string;
  setChatId: (id: string) => void;
  setNewChatId: (id: string) => void;
  resetNewChatId: () => void;
}

const chatIdStore = create<ChatIdState>((set) => ({
  chatId: "",
  newChatId: genId(),
  setChatId: (chatId) => set({ chatId }),
  setNewChatId: (newChatId) => set({ newChatId }),
  resetNewChatId: () => set({ newChatId: genId() }),
}));

const useChatId = createSelectors(chatIdStore);
export { chatIdStore, useChatId };
