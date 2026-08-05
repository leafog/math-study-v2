import { useContext } from "react";
import {
  ActiveChatContext,
  ChatHelpersContext,
  ChatToolsPanelStoreContext,
  ChatToolsContext,
  ChatProblemsContext,
  ChatKgTopicsContext,
  ChatPromptInputContext,
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
