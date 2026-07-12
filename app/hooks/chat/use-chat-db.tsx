import type { UIChatMessage } from "./types";

const useChatDb = (chatId: string | undefined) => {
  const messages: UIChatMessage[] = [];
  return { messages };
};

export default useChatDb;
