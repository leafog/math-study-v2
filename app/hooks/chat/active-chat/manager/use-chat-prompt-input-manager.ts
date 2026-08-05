import { useMemo } from "react";
import { createChatPromptInputStore } from "~/store/chat-prompt-input-store";

const useChatPromptInputManager = (isNewChat: boolean, chatId: string) => {
  const store = useMemo(
    () => createChatPromptInputStore(isNewChat, chatId),
    [isNewChat, chatId],
  );
  return store;
};

export default useChatPromptInputManager;
