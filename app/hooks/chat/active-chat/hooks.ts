import { useContext } from "react";
import type { LanguageModel } from "ai";
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

export const useActiveChat = () => {
  const ctx = useContext(ActiveChatContext);
  if (!ctx) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return ctx;
};

export const useActiveChatHelpers = () => {
  const ctx = useContext(ChatHelpersContext);

  if (!ctx) {
    throw new Error(
      "useActiveChatHelpers must be used within ActiveChatProvider",
    );
  }
  return ctx;
};

export const useActiveChatToolsPanelStore = () => {
  const ctx = useContext(ChatToolsPanelStoreContext);

  if (!ctx) {
    throw new Error(
      "useActiveChatToolsPanelStore must be used within ActiveChatProvider",
    );
  }

  return ctx;
};

export const useChatTools = () => {
  const ctx = useContext(ChatToolsContext);

  if (!ctx) {
    throw new Error("useChatTools must be used within ActiveChatProvider");
  }

  return ctx;
};

export const useChatProblems = () => {
  const ctx = useContext(ChatProblemsContext);

  if (!ctx) {
    throw new Error("useChatProblems must be used within ActiveChatProvider");
  }

  return ctx;
};

export const useChatKgTopics = () => {
  const ctx = useContext(ChatKgTopicsContext);

  if (!ctx) {
    throw new Error("useChatKgTopics must be used within ActiveChatProvider");
  }

  return ctx;
};

export const useChatPromptInput = () => {
  const ctx = useContext(ChatPromptInputContext);

  if (!ctx) {
    throw new Error(
      "useActiveChatPromptInputStore must be used within ActiveChatProvider",
    );
  }

  return ctx;
};

export const useChatAgent = () => {
  const ctx = useContext(ChatAgentContext);

  if (!ctx) {
    throw new Error("useChatAgent must be used within ActiveChatProvider");
  }

  return ctx;
};

/**
 * 取当前激活的 LanguageModel 实例。与其它 hook 不同:null 是合法状态
 * (尚未选模型),子组件据此禁用「生成对象」入口,而不是抛错。
 */
export const useChatModel = (): LanguageModel | null =>
  useContext(ChatModelContext);
