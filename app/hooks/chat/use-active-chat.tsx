import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { genId } from "~/lib/id-utils";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import { transport } from "~/lib/agent/client-agent";
import { useLocation, useParams } from "react-router";

import type { ChatMessage } from "./types";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { conversations } from "~/db/tdb-collections";
type ActiveChatState = {} & UseChatHelpers<ChatMessage>;
const ActiveChatContext = createContext<ActiveChatState | null>(null);

function extractChatId(pathname: string): string | null {
  const match = pathname.match(/\/chat\/([^/]+)/);
  return match ? match[1] : null;
}

export const ActiveChatProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();

  const chatIdFromUrl = extractChatId(pathname);
  const isNewChat = !chatIdFromUrl;
  const newChatIdRef = useRef(genId());
  const prevPathnameRef = useRef(pathname);

  if (isNewChat && prevPathnameRef.current !== pathname) {
    newChatIdRef.current = genId();
  }
  prevPathnameRef.current = pathname;
  const chatId = chatIdFromUrl ?? newChatIdRef.current;

  const { data: currentConversations } = useLiveQuery(
    (q) => {
      return q
        .from({ conversations })
        .where(({ conversations }) => eq(conversations.id, chatId))
        .findOne();
    },
    [chatId],
  );
  useEffect(() => {
    console.log(currentConversations);
  }, [currentConversations]);

  const chat = useChat<ChatMessage>({
    id: chatId,
    transport,
    messages: [],
    onData: (d) => console.log("data", d),
    onFinish: ({ message }) => {
      if (currentConversations === undefined) {
        conversations.insert({
          id: chatId,
          title: "title",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    },
  });

  return (
    <ActiveChatContext.Provider value={chat}>
      {children}
    </ActiveChatContext.Provider>
  );
};

export const useActiveChat = () => {
  const ctx = useContext(ActiveChatContext);
  if (!ctx) {
    throw new Error("useActiveChat must be used within ActiveChatProvider");
  }
  return ctx as ReturnType<typeof useChat>;
};
