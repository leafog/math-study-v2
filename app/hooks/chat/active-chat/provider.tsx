import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Chat, useChat, useObject } from "@ai-sdk/react";
import { useAgent } from "~/lib/agent/client-agent";
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
  ChatModelContext,
} from "./context";
import { useChatIdManager } from "./manager/use-chat-id-manager";
import { useMessagesManager } from "./manager/use-messages-manager";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";
import useChatProblemsManager from "./manager/use-chat-problems-manager";
import useChatKgTopicsManager from "./manager/use-chat-kg-topics-manager";
import useChatPromptInputManager from "./manager/use-chat-prompt-input-manager";
import useChatAgentManager from "./manager/use-chat-agent-manager";
import { toast } from "sonner";
import type { LanguageModel } from "ai";

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  // const { chatId, isNewChat, createChat } = useChatIdManager();

  const activeChatState = useChatIdManager();

  const { chatId, isNewChat, createChat } = activeChatState;

  const initMessages = useMessagesManager(chatId);

  const chatAgentState = useChatAgentManager();
  const chatPromptInputStore = useChatPromptInputManager(isNewChat, chatId);
  const { id, model_name } = chatPromptInputStore.use.currentModel() ?? {};
  const reasoning = chatPromptInputStore.use.reasoning();
  const config = chatAgentState.settings.find((it) => it.id === id);

  const agentTransport = useAgent(
    config?.provider_id as ProviderId | undefined,
    config ? { apiKey: config.api_key, baseUrl: config.base_url } : undefined,
    model_name,
    reasoning,
  );
  const model: LanguageModel | null = agentTransport?.model ?? null;

  const transportRef = useRef(agentTransport);
  transportRef.current = agentTransport;

  const chatInstanceRef = useRef<Chat<UIChatMessage> | null>(null);
  const pendingStopRef = useRef<(() => Promise<void>) | null>(null);

  if (chatInstanceRef.current?.id !== chatId) {
    if (chatInstanceRef.current) {
      // 切换会话:把旧 Chat 的 stop 推迟到 effect 中执行,
      // 中止旧会话仍在进行的 LLM 流(否则成为孤儿流,持续占用 CPU/内存/API)
      pendingStopRef.current = chatInstanceRef.current.stop;
    }
    chatInstanceRef.current = new Chat<UIChatMessage>({
      id: chatId,
      transport: {
        sendMessages: (opts) =>
          transportRef.current!.transport.sendMessages(opts),
        reconnectToStream: (opts) =>
          transportRef.current!.transport.reconnectToStream(opts),
      },
      generateId: genId,
      messages: initMessages,
      onToolCall: async ({ toolCall }) => {},
      onError: (error) => {
        toast.error(error.message, { position: "top-center" });
      },
      onFinish: ({ message, isAbort }) => {
        // 切换会话导致的中止:消息不完整且属于旧会话,不落库
        if (isAbort) return;
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
    });
  }

  useEffect(() => {
    pendingStopRef.current?.();
    pendingStopRef.current = null;
  }, [chatId]);

  const chatHelpersRaw = useChat<UIChatMessage>({
    chat: chatInstanceRef.current,
    throttle: 100,
  });

  // 兜底:切到已有会话时,若 initMessages 在 Chat 创建之后才到达,
  // 同步一次历史消息(仅在空闲且本会话未同步过时,避免与进行中的流冲突)
  const syncedChatRef = useRef<string | null>(null);
  const chatStatus = chatHelpersRaw.status;

  useEffect(() => {
    if (!initMessages?.length) return;
    if (syncedChatRef.current === chatId) return;
    if (chatStatus === "streaming" || chatStatus === "submitted") return;
    chatHelpersRaw.setMessages(initMessages);
    syncedChatRef.current = chatId;
  }, [chatId, initMessages, chatStatus, chatHelpersRaw.setMessages]);

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
                    <ChatModelContext.Provider value={model}>
                      {children}
                    </ChatModelContext.Provider>
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
