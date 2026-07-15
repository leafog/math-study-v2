import { createContext } from "react";
import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIChatMessage } from "../types";
import type { ChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { useChatToolsManager } from "./manager/use-chat-tools-manager";
import type { useChatIdManager } from "./manager/use-chat-id-manager";

export type ActiveChatState = ReturnType<typeof useChatIdManager>;

export const ActiveChatContext = createContext<ActiveChatState | null>(null);
export const ChatHelpersContext =
  createContext<UseChatHelpers<UIChatMessage> | null>(null);

export const ChatToolsPanelStoreContext =
  createContext<ChatToolsPanelStore | null>(null);

export type ChatToolsState = ReturnType<typeof useChatToolsManager>;
export const ChatToolsContext = createContext<ChatToolsState | null>(null);
