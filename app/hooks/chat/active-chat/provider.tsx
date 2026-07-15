import { useMemo, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { transport } from "~/lib/agent/client-agent";
import { genId } from "~/lib/id-utils";
import { messagesColl } from "~/db/tdb-collections";
import { createChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { useHydrated } from "~/store/use-hydrated";
import type { UIChatMessage } from "../types";
import {
  ActiveChatContext,
  ChatHelpersContext,
  ChatToolsPanelStoreContext,
  ChatToolsContext,
  type ActiveChatState,
} from "./context";
import { useChatIdManager } from "./manager/use-chat-id-manager";
import { useMessagesManager } from "./manager/use-messages-manager";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  const { chatId, isNewChat } = useChatIdManager();

  const initMessages = useMessagesManager(chatId);

  const chatHelpers = useChat<UIChatMessage>({
    id: chatId,
    transport,
    generateId: genId,
    messages: initMessages,
    onFinish: ({ message }) => {
      messagesColl.insert({
        conversationId: chatId,
        createdAt: new Date(),
        ...message,
      });
    },
  });

  const activeChatState: ActiveChatState = useMemo(
    () => ({ isNewChat }),
    [isNewChat],
  );

  const chatToolsPanelStore = useMemo(
    () => createChatToolsPanelStore(isNewChat, chatId),
    [isNewChat, chatId],
  );

  const hydrated = useHydrated(chatToolsPanelStore);

  const chatToolsManager = useChatToolsManager(chatId);

  return (
    <ActiveChatContext.Provider value={activeChatState}>
      <ChatHelpersContext.Provider value={chatHelpers}>
        <ChatToolsPanelStoreContext.Provider value={chatToolsPanelStore}>
          <ChatToolsContext.Provider value={chatToolsManager}>
            {hydrated ? children : null}
          </ChatToolsContext.Provider>
        </ChatToolsPanelStoreContext.Provider>
      </ChatHelpersContext.Provider>
    </ActiveChatContext.Provider>
  );
};
