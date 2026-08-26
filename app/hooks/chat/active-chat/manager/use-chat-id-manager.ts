import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { chatToolsBarStateColl, conversationColl } from "~/db/tdb-collections";

import { createTx } from "~/db/tx";
import { chatIdStore } from "~/store/chat-id-store";
import { useSync } from "~/hooks/use-sync";
import { useLiveQuery } from "@tanstack/react-db";

export const useChatIdManager = () => {
  const navigate = useNavigate();
  const { chatId: chatIdFromUrl } = useParams<{ chatId: string }>();
  const { newChatId, resetNewChatId, setChatId } = chatIdStore.getState();
  useEffect(() => {
    if (chatIdFromUrl) {
      const conversation = conversationColl.get(chatIdFromUrl);
      if (!conversation) {
        navigate("/");
      }
    }
  }, [chatIdFromUrl]);
  const isNewChat = chatIdFromUrl === undefined;

  const chatId = chatIdFromUrl ?? newChatId;
  const conversation = useMemo(() => {
    if (isNewChat) {
      return undefined;
    }
    return conversationColl.get(chatId);
  }, [chatId]);
  useSync(chatId, setChatId);
  const createChat = async (title: string) => {
    const id = chatId;
    const tx = createTx();
    tx.mutate(() => {
      conversationColl.insert({
        id,
        title,
        created_at: new Date(),
        updated_at: new Date(),
      });
      chatToolsBarStateColl.insert({
        id,
        tool_order: [],
        actived_history: [],
      });
    });
    await tx.isPersisted.promise;
    navigate(`/chat/${id}`);
    resetNewChatId();
  };

  const renameChatTitle = async (title: string) => {
    if (isNewChat) return;
    const conversation = conversationColl.get(chatId);
    if (conversation) {
      conversationColl.update(conversation.id, (draft) => {
        draft.title = title;
        draft.updated_at = new Date();
      });
    }
  };

  const context = useMemo(
    () => ({
      chatId,
      isNewChat,
      createChat,
      renameChatTitle,
      conversation,
    }),
    [chatId, isNewChat, createChat, renameChatTitle, conversation],
  );

  return context;
};
