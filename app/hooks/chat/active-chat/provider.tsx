import { useEffect, useMemo, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { transport } from "~/lib/agent/client-agent";
import { genId } from "~/lib/id-utils";
import { conversationColl, chatMessageColl } from "~/db/tdb-collections";
import { createChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import type { UIChatMessage } from "../types";
import {
  ActiveChatContext,
  ChatHelpersContext,
  ChatToolsPanelStoreContext,
  ChatToolsContext,
} from "./context";
import { useChatIdManager } from "./manager/use-chat-id-manager";
import { useMessagesManager } from "./manager/use-messages-manager";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";
import { createTx } from "~/db/tx";
import { useNavigate } from "react-router";

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  // const { chatId, isNewChat, createChat } = useChatIdManager();

  const activeChatState = useChatIdManager();

  const { chatId, isNewChat, createChat } = activeChatState;

  const initMessages = useMessagesManager(chatId);
  const chatHelpers = useChat<UIChatMessage>({
    id: chatId,
    transport,
    generateId: genId,
    messages: initMessages,
    onFinish: ({ message }) => {
      chatMessageColl.insert({
        conversation_id: chatId,
        created_at: new Date(),
        ...message,
      });
    },
  });

const chatToolsPanelStore = useMemo(() => {
    return createChatToolsPanelStore(isNewChat, chatId);
  }, [isNewChat, chatId]);

  const onOpenBefore = (kind: string, title?: string) => {
    if (isNewChat) {
      createChat(title ?? kind);
    }
  };
  const chatToolsManager = useChatToolsManager(chatId, onOpenBefore);
  return (
    <ActiveChatContext.Provider value={activeChatState}>
      <ChatHelpersContext.Provider value={chatHelpers}>
        <ChatToolsPanelStoreContext.Provider value={chatToolsPanelStore}>
          <ChatToolsContext.Provider value={chatToolsManager}>
            {children}
          </ChatToolsContext.Provider>
        </ChatToolsPanelStoreContext.Provider>
      </ChatHelpersContext.Provider>
    </ActiveChatContext.Provider>
  );
};
