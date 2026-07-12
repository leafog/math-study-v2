import {
  createContext,
  use,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { genId } from "~/lib/id-utils";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { transport } from "~/lib/agent/client-agent";
import { useLocation, useNavigate } from "react-router";

import type { UIChatMessage } from "./types";
import {
  eq,
  queryOnce,
  useLiveQuery,
  useLiveQueryEffect,
  useLiveSuspenseQuery,
} from "@tanstack/react-db";
import { conversationsColl, messagesColl } from "~/db/tdb-collections";

type ActiveChatState = {
  isNewChat: boolean;
} & UseChatHelpers<UIChatMessage>;
const ActiveChatContext = createContext<ActiveChatState | null>(null);
const chatRegExp = new RegExp(/\/chat\/([^/]+)/);
function extractChatId(pathname: string): string | null {
  const match = chatRegExp.exec(pathname);
  return match ? match[1] : null;
}

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const chatIdFromUrl = extractChatId(pathname);
  const hasChatIdInUrl = chatIdFromUrl !== null;

  const { data: currentConversations } = useLiveSuspenseQuery(
    (q) => {
      return q
        .from({ conversationsColl })
        .where(({ conversationsColl }) =>
          eq(conversationsColl.id, chatIdFromUrl),
        )
        .findOne();
    },
    [chatIdFromUrl],
  );
  const isNewChat = !hasChatIdInUrl && currentConversations === undefined;

  useEffect(() => {
    if (hasChatIdInUrl && currentConversations === undefined) {
      navigate("/", { replace: true });
    }
  }, [hasChatIdInUrl, currentConversations, status]);

  const newChatIdRef = useRef(genId());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = genId();
  }

  prevPathnameRef.current = pathname;
  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const initMessagePromise = useMemo(
    () =>
      queryOnce((q) => {
        console.log("run");
        return q
          .from({ messagesColl })
          .where(({ messagesColl }) => eq(messagesColl.conversationId, chatId))
          .orderBy(({ messagesColl }) => messagesColl.createdAt, {
            direction: "asc",
          });
      }),
    [chatId],
  );
  const initMessage = use(initMessagePromise);

  const chat = useChat<UIChatMessage>({
    id: chatId,
    transport,
    generateId: genId,
    messages: initMessage,
    onData: (d) => console.log("data", d),
    onFinish: ({ message }) => {
      messagesColl.insert({
        conversationId: chatId,
        createdAt: new Date(),
        ...message,
      });
    },
  });
  const { setMessages, error, id } = chat;

  useEffect(() => {
    console.log(initMessage, "wow");
  }, [initMessage]);

  const value: ActiveChatState = useMemo(
    () => ({ isNewChat, ...chat }),
    [isNewChat, chat],
  );

  return (
    <ActiveChatContext.Provider value={value}>
      {children}
    </ActiveChatContext.Provider>
  );
};

export const useActiveChat = () => {
  const ctx = useContext(ActiveChatContext);
  if (!ctx) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return ctx;
};
