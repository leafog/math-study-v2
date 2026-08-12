import { useEffect, useMemo, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { transport, useAgent } from "~/lib/agent/client-agent";
import { genId } from "~/lib/id-utils";
import { chatMessageColl } from "~/db/tdb-collections";
import { createChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import type { ProviderId, UIChatMessage } from "~/lib/agent/types";
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
import { toast } from "sonner";

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  // const { chatId, isNewChat, createChat } = useChatIdManager();

  const activeChatState = useChatIdManager();

  const { chatId, isNewChat, createChat } = activeChatState;

  const initMessages = useMessagesManager(chatId);

  const chatAgentState = useChatAgentManager();
  const chatPromptInputStore = useChatPromptInputManager(isNewChat, chatId);
  const { id, model_name } = chatPromptInputStore.use.currentModel() ?? {};
  const config = chatAgentState.settings.find((it) => it.id === id);

  const agentTransport = useAgent(
    config?.provider_id as ProviderId | undefined,
    config ? { apiKey: config.api_key, baseUrl: config.base_url } : undefined,
    model_name,
  );

  const chatHelpersRaw = useChat<UIChatMessage>({
    id: chatId,
    transport: agentTransport!,
    generateId: genId,
    messages: initMessages,
    throttle: 100,
    onToolCall: async ({ toolCall }) => {},
    onError: (error) => {
      toast.error(error.message, { position: "top-center" });
    },
    onFinish: ({ message }) => {
      const meta = message.metadata as Record<string, number> | undefined;
      if (meta) {
        // Collect reasoning start/end timestamps from Date.now()-based keys
        const startKeys = Object.keys(meta)
          .filter((k) => k.startsWith("reasoning-start:"))
          .sort((a, b) => meta[a]! - meta[b]!);
        const endKeys = Object.keys(meta)
          .filter((k) => k.startsWith("reasoning-end:"))
          .sort((a, b) => meta[a]! - meta[b]!);
        const reasoningParts = message.parts?.filter(
          (part) => part.type === "reasoning",
        );
        if (reasoningParts) {
          reasoningParts.forEach((part, i) => {
            if (i < startKeys.length && i < endKeys.length) {
              const start = meta[startKeys[i]!];
              const end = meta[endKeys[i]!];
              if (start != null && end != null) {
                (part as any)._duration = Math.ceil((end - start) / 1000);
              }
            }
          });
        }
      }
      chatMessageColl.insert({
        chat_id: chatId,
        created_at: new Date(),
        ...message,
      });
    },
    // sendAutomaticallyWhen: () => true,
  });

  const chatHelpers = useMemo(
    () => chatHelpersRaw,
    [chatHelpersRaw.messages, chatHelpersRaw.status, chatHelpersRaw.error],
  );

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
