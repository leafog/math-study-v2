import { create } from "zustand";
import { createSelectors } from "./create-selectors";

interface ChatIdState {
  chatId: string;
  setChatId: (id: string) => void;
}

const chatIdStore = create<ChatIdState>((set) => ({
  chatId: "",
  setChatId: (chatId) => set({ chatId }),
}));
const useChatId = createSelectors(chatIdStore);
export { chatIdStore, useChatId };
