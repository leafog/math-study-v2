import type { ChatMessage } from "./types";

const useChatDb = (chatId: string | undefined) => {
  const messages: ChatMessage[] = [];

  return { messages };
};

export default useChatDb;
