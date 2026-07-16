import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { eq, useLiveSuspenseQuery, useLiveQuery } from "@tanstack/react-db";
import { chatToolsBarStateColl, conversationColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { createTx } from "~/db/tx";

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

  const { data: currentConversations } = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ conversationColl })
        .where(({ conversationColl }) => eq(conversationColl.id, chatIdFromUrl))
        .findOne(),
    [chatIdFromUrl],
  );

  const isNewChat = !hasChatIdInUrl && currentConversations === undefined;

  useEffect(() => {
    if (hasChatIdInUrl && currentConversations === undefined) {
      navigate("/", { replace: true });
    }
  }, [hasChatIdInUrl, currentConversations, navigate]);

  const newChatIdRef = useRef(genId());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = genId();
  }

  prevPathnameRef.current = pathname;

  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  // only sign
  const createChat = (title: string) => {
    const id = chatId;
    const tx = createTx();
    tx.mutate(() => {
      conversationColl.insert({
        id,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      chatToolsBarStateColl.insert({
        id,
        toolOrder: [],
        activedHistory: [],
      });
    });
    navigate(`/chat/${id}`);
  };

  return { chatId, isNewChat, createChat };
};
