import { create } from "zustand";

interface ChatIdState {
  chatId: string;
  setChatId: (id: string) => void;
}

const chatIdStore = create<ChatIdState>((set) => ({
  chatId: "",
  setChatId: (chatId) => set({ chatId }),
}));

export { chatIdStore };
