import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Chat, useChat, useObject } from "@ai-sdk/react";
import { useAgent } from "~/lib/agent/client-agent";
import { genId } from "~/lib/id-utils";
import { chatMessageColl, conversationColl } from "~/db/tdb-collections";
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
import { useGenerateObject } from "./use-generate-object";

import z from "zod";
import { useTranslation } from "react-i18next";
import { getPrompt } from "~/lib/agent/instructions";
import { useEvent } from "~/event/use-event";
import { newChatPromptInputStore } from "~/store/chat-prompt-input-store";
import { bus } from "~/event/event-bus";
const ChatTitleSchema = z.object({
  title: z.string(),
});

/** 提取消息 parts 里的纯文本(type 为 "text" 的部分)。 */
const partsToText = (parts?: Array<{ type?: string; text?: string }>): string =>
  (parts ?? [])
    .filter((p) => p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join(" ")
    .trim();
export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  const activeChatState = useChatIdManager();
  const { i18n } = useTranslation();
  const { chatId, isNewChat, createChat } = activeChatState;

  const initMessages = useMessagesManager(chatId);

  const chatAgentState = useChatAgentManager();
  const chatPromptInputStore = useChatPromptInputManager(isNewChat, chatId);
  const { id, model_name } = chatPromptInputStore.use.currentModel() ?? {};
  const reasoning = chatPromptInputStore.use.reasoning();
  const config = chatAgentState.getConfigById(id);

  const agentTransport = useAgent(
    config?.provider_id as ProviderId | undefined,
    config ? { apiKey: config.api_key, baseURL: config.base_url } : undefined,
    model_name,
    reasoning,
  );
  const model: LanguageModel | null = agentTransport?.model ?? null;

  const { generate: generateChatTitle } = useGenerateObject(
    ChatTitleSchema,
    model,
  );

  const transportRef = useRef(agentTransport);
  transportRef.current = agentTransport;

  const chatInstanceRef = useRef<Chat<UIChatMessage> | null>(null);
  const pendingStopRef = useRef<(() => Promise<void>) | null>(null);

  if (chatInstanceRef.current?.id !== chatId) {
    if (chatInstanceRef.current) {
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
      onFinish: ({ message, isAbort, messages }) => {
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

        if (messages.length === 2) {
          const [userMsg, assistantMsg] = messages;
          const conversation = JSON.stringify({
            user: partsToText(userMsg.parts),
            assistant: partsToText(assistantMsg.parts),
          });
          const language = i18n.language?.toLowerCase().startsWith("zh")
            ? "Chinese"
            : "English";
          const prompt = getPrompt("title.generate", {
            vars: { language, conversation },
          });
          generateChatTitle(prompt).then((it) => {
            if (it?.title) {
              conversationColl.update(chatId, (draft) => {
                draft.title = it.title;
              });
            }
          });
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
  const openToolsShow = chatToolsPanelStore.use.openToolsShow();
  useEvent("open:tool", () => openToolsShow());

  const onOpenBefore = (kind: string, title?: string, _refId?: string) => {
    if (isNewChat) {
      bus.emit("chat:create:by-open-tool");
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
