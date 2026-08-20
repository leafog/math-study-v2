import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { chatToolsBarStateColl, conversationColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { createTx } from "~/db/tx";
import { chatIdStore } from "~/store/chat-id-store";

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

  // 用 getState 非响应式读写，避免在渲染期 setState 触发本组件自身重渲的告警。
  // newChatId 只在渲染时同步读一次（本地已赋值），无需订阅响应式更新。
  const { newChatId, setNewChatId, resetNewChatId, setChatId } =
    chatIdStore.getState();

  // 惰性初始化到 store：store 为模块级单例，StrictMode 的模拟卸载不会重置它，
  // 故两次挂载读到同一个 id，避免二次生成与 chatId 跳变。
  // 首帧用局部变量同步取值，避免出现空 chatId 的一帧。
  let id = newChatId;
  if (isNewChat && !id) {
    id = genId();
    setNewChatId(id);
  }
  const chatId = chatIdFromUrl ?? id;

  // 离开新聊天时清空，下次进入时重新生成（保证每次新聊天一个全新的稳定 id）
  useEffect(() => {
    if (!isNewChat) {
      resetNewChatId();
    }
  }, [isNewChat]);

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
