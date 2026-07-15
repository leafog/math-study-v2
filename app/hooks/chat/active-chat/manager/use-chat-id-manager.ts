import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { conversationsColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";

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
        .from({ conversationsColl })
        .where(({ conversationsColl }) =>
          eq(conversationsColl.id, chatIdFromUrl),
        )
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

  return { chatId, isNewChat };
};
