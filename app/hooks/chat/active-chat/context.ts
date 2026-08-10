import { createContext } from "react";
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
