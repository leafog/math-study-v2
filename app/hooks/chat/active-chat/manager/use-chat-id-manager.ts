import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { chatToolsBarStateColl, conversationColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { createTx } from "~/db/tx";
import { chatIdStore } from "~/store/chat-id-store";
import { useStore } from "zustand";

const chatRegExp = new RegExp(/\/chat\/([^/]+)/);

const extractChatId = (pathname: string): string | null => {
  const match = chatRegExp.exec(pathname);
  return match ? match[1] : null;
};

export const useChatIdManager = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const chatIdFromUrl = extractChatId(pathname);
  const hasChatIdInUrl = chatIdFromUrl !== null;

  const { data: currentConversation, isReady: conversationReady } =
    useLiveQuery(
      {
        query: (q) =>
          q
            .from({ conversationColl })
            .where(({ conversationColl }) =>
              eq(conversationColl.id, chatIdFromUrl),
            )
            .findOne(),
      },
      [chatIdFromUrl],
    );

  const isNewChat = !hasChatIdInUrl && currentConversation === undefined;

  useEffect(() => {
    if (!hasChatIdInUrl) return;
    if (!conversationReady) return;
    if (currentConversation === undefined) {
      //  navigate("/", { replace: true });
    }
  }, [conversationReady, hasChatIdInUrl, currentConversation, navigate]);

  const newChatIdRef = useRef(genId());

  // 新聊天时生成新 ID，移到 effect 避免 render 副作用
  useEffect(() => {
    if (isNewChat) {
      newChatIdRef.current = genId();
    }
  }, [isNewChat]);

  const chatId = chatIdFromUrl ?? newChatIdRef.current;
  const setChatId = useStore(chatIdStore).setChatId;

  useEffect(() => {
    setChatId(chatId);
  }, [chatId]);

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
  };

  return { chatId, isNewChat, createChat, currentConversation };
};
