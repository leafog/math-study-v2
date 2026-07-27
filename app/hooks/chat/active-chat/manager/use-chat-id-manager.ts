import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { eq, useLiveSuspenseQuery, useLiveQuery } from "@tanstack/react-db";
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

  const { data: currentConversation } = useLiveQuery(
    (q) =>
      q
        .from({ conversationColl })
        .where(({ conversationColl }) => eq(conversationColl.id, chatIdFromUrl))
        .findOne(),
    [chatIdFromUrl],
  );

  const isNewChat = !hasChatIdInUrl && currentConversation === undefined;

  useEffect(() => {
    if (hasChatIdInUrl && currentConversation === undefined) {
      navigate("/", { replace: true });
    }
  }, [hasChatIdInUrl, currentConversation, navigate]);

  const newChatIdRef = useRef(genId());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = genId();
  }

  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;
  const setChatId = useStore(chatIdStore).setChatId;
  // 同步 chatId 到外部 store，非 React 环境也可读取
  useEffect(() => {
    setChatId(chatId);
  }, [chatId]);

  const createChat = (title: string) => {
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
    navigate(`/chat/${id}`);
  };

  return { chatId, isNewChat, createChat, currentConversation };
};
