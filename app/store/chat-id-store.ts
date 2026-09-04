import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSelectors } from "./create-selectors";
import { genId } from "~/lib/id-utils";

interface ChatIdState {
  chatId: string;
  newChatId: string;
  setChatId: (id: string) => void;
  setNewChatId: (id: string) => void;
  resetNewChatId: () => void;
}

const chatIdStore = create<ChatIdState>()(
  persist(
    (set) => ({
      chatId: "",
      newChatId: genId(),
      setChatId: (chatId) => set({ chatId }),
      setNewChatId: (newChatId) => set({ newChatId }),
      resetNewChatId: () => set({ newChatId: genId() }),
    }),
    {
      name: "chat-id",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        chatId: state.chatId,
        newChatId: state.newChatId,
      }),
    },
  ),
);

const useChatId = createSelectors(chatIdStore);
export { chatIdStore, useChatId };
