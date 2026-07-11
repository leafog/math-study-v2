import { createUIMessageStream, type UIMessage } from "ai";
import { useLiveQuery } from "dexie-react-hooks";

type ChatInit = {
  messages: UIMessage[];
};
const DEFAULT_CHAT_INIT: ChatInit = {
  messages: [],
};
const useChatInit = (chatId: string) => {};

export default useChatInit;
