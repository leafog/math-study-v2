import { createContext } from "react";
import type { LanguageModel } from "ai";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIChatMessage } from "~/lib/agent/types";
import type { ChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";
import type { useChatIdManager } from "./manager/use-chat-id-manager";
import type useChatProblemsManager from "./manager/use-chat-problems-manager";
import type useChatKgTopicsManager from "./manager/use-chat-kg-topics-manager";
import type useChatPromptInputManager from "./manager/use-chat-prompt-input-manager";
import type useChatAgentManager from "./manager/use-chat-agent-manager";

export type ActiveChatState = ReturnType<typeof useChatIdManager>;

export const ActiveChatContext = createContext<ActiveChatState | null>(null);
export const ChatHelpersContext =
  createContext<UseChatHelpers<UIChatMessage> | null>(null);

export const ChatToolsPanelStoreContext =
  createContext<ChatToolsPanelStore | null>(null);

export type ChatToolsState = ReturnType<typeof useChatToolsManager>;
export const ChatToolsContext = createContext<ChatToolsState | null>(null);

export type ChatProblemsState = ReturnType<typeof useChatProblemsManager>;

export const ChatProblemsContext = createContext<ChatProblemsState | null>(
  null,
);

export type ChatKgTopicsState = ReturnType<typeof useChatKgTopicsManager>;
export const ChatKgTopicsContext = createContext<ChatKgTopicsState | null>(
  null,
);
export type ChatPromptInput = ReturnType<typeof useChatPromptInputManager>;

export const ChatPromptInputContext = createContext<ChatPromptInput | null>(
  null,
);

export type ChatAgentState = ReturnType<typeof useChatAgentManager>;
export const ChatAgentContext = createContext<ChatAgentState | null>(null);

/**
 * 当前会话激活的 LanguageModel 实例(供子组件做独立于聊天的生成,
 * 如 generateObject({ model, schema, prompt }))。
 * 值为 null 表示尚未选中可用模型(合法状态,非 Provider 缺失)。
 */
export const ChatModelContext = createContext<LanguageModel | null>(null);
