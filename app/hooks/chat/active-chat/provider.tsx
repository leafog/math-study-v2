import { useEffect, useMemo, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { transport } from "~/lib/agent/client-agent";
import { genId } from "~/lib/id-utils";
import { chatMessageColl } from "~/db/tdb-collections";
import { createChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import type { UIChatMessage } from "~/lib/agent/types";
import {
  ActiveChatContext,
  ChatHelpersContext,
  ChatToolsPanelStoreContext,
  ChatToolsContext,
  ChatProblemsContext,
  ChatKgTopicsContext,
  ChatPromptInputContext,
  ChatAgentContext,
} from "./context";
import { useChatIdManager } from "./manager/use-chat-id-manager";
import { useMessagesManager } from "./manager/use-messages-manager";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";
import useChatProblemsManager from "./manager/use-chat-problems-manager";
import useChatKgTopicsManager from "./manager/use-chat-kg-topics-manager";
import useChatPromptInputManager from "./manager/use-chat-prompt-input-manager";
import useChatAgentManager from "./manager/use-chat-agent-manager";

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
    onToolCall: async ({ toolCall }) => {},
    onFinish: ({ message }) => {
      chatMessageColl.insert({
        chat_id: chatId,
        created_at: new Date(),
        ...message,
      });
    },
    // sendAutomaticallyWhen: () => true,
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
  const chatProblemState = useChatProblemsManager(chatId);
  const chatKgTopicsState = useChatKgTopicsManager(chatId);
  const chatPromptInputStore = useChatPromptInputManager(isNewChat, chatId);
  const chatAgentState = useChatAgentManager();

  return (
    <ChatAgentContext.Provider value={chatAgentState}>
      <ActiveChatContext.Provider value={activeChatState}>
        <ChatHelpersContext.Provider value={chatHelpers}>
          <ChatToolsPanelStoreContext.Provider value={chatToolsPanelStore}>
            <ChatToolsContext.Provider value={chatToolsManager}>
              <ChatProblemsContext.Provider value={chatProblemState}>
                <ChatKgTopicsContext.Provider value={chatKgTopicsState}>
                  <ChatPromptInputContext.Provider value={chatPromptInputStore}>
                    {children}
                  </ChatPromptInputContext.Provider>
                </ChatKgTopicsContext.Provider>
              </ChatProblemsContext.Provider>
            </ChatToolsContext.Provider>
          </ChatToolsPanelStoreContext.Provider>
        </ChatHelpersContext.Provider>
      </ActiveChatContext.Provider>
    </ChatAgentContext.Provider>
  );
};
