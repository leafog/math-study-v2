import { useEffect, useMemo, useRef } from "react";
import type { ComponentProps } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { DragDropProvider, type DragDropEventHandlers } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import {
  and,
  eq,
  inArray,
  isNull,
  not,
  useLiveInfiniteQuery,
  useLiveQuery,
} from "@tanstack/react-db";
import { conversationColl, conversationPinColl } from "~/db/tdb-collections";
import { createTx } from "~/db/tx";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";
import ChatSidebarItem from "./chat-sidebar-item";

const PAGE_SIZE = 30;

/** 可拖拽排序的置顶项：把 sortable ref 转发到 ChatSidebarItem 主按钮 */
function SortablePinItem({
  index,
  ...props
}: { index: number } & ComponentProps<typeof ChatSidebarItem>) {
  const { ref, isDragging } = useSortable({
    id: props.chat.id,
    index,
    group: "pins",
  });

  return <ChatSidebarItem {...props} ref={ref} dragging={isDragging} />;
}

const NavHistoryChat = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { data: pinChats = [] } = useLiveQuery(
    (q) =>
      q
        .from({ conversationPinColl })
        .join(
          { conversationColl },
          ({ conversationColl, conversationPinColl }) =>
            eq(conversationColl.id, conversationPinColl.chat_id),
        )

        .orderBy(({ conversationPinColl }) => conversationPinColl.sort_order, {
          direction: "asc",
        })
        .select(({ conversationColl, conversationPinColl }) => ({
          ...conversationColl,
        })),
    [],
  );

  const pinnedSet = useMemo(
    () => new Set(pinChats.map((p) => p.id)),
    [pinChats],
  );

  const { pages, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLiveInfiniteQuery(
      (q) =>
        q
          .from({ conversationColl })
          .where(({ conversationColl }) =>
            and(
              not(inArray(conversationColl.id, [...pinnedSet])),
              isNull(conversationColl.archived_at),
            ),
          )
          .orderBy(
            ({ conversationColl }) => conversationColl.created_at,
            "desc",
          ),
      { pageSize: PAGE_SIZE },
      [pinnedSet],
    );
  const allChats = pages.flat();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 用 ref 存 fetchNextPage，避免 Observer 因回调引用变化而重建
  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = sentinel.closest<HTMLElement>('[data-slot="sidebar-content"]');
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPageRef.current();
        }
      },
      { root, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  const saveTitle = (id: string, title: string) => {
    const trimmed = title.trim();
    if (trimmed) {
      conversationColl.update(id, (draft) => {
        draft.title = trimmed;
        draft.updated_at = new Date();
      });
    }
  };

  const togglePin = (chatId: string) => {
    const tx = createTx();
    tx.mutate(() => {
      if (pinnedSet.has(chatId)) {
        conversationPinColl.delete(chatId);
      } else {
        conversationPinColl.insert({
          id: chatId,
          chat_id: chatId,
          sort_order: pinChats.length + 1,
          created_at: new Date(),
        });
      }
    });
  };

  const archiveChat = (chatId: string) => {
    const tx = createTx();
    tx.mutate(() => {
      conversationColl.update(chatId, (draft) => {
        draft.archived_at = new Date();
        draft.updated_at = new Date();
      });
      // 归档同时解除置顶，避免归档项残留在置顶列表
      if (pinnedSet.has(chatId)) {
        conversationPinColl.delete(chatId);
      }
    });
  };

  const handlePinDragEnd: DragDropEventHandlers["onDragEnd"] = (event) => {
    const source = event.operation.source;
    if (!source || !isSortable(source)) return;
    const ids = pinChats.map((p) => p.id);
    const [moved] = ids.splice(source.initialIndex, 1);
    ids.splice(source.index, 0, moved);
    const tx = createTx();
    tx.mutate(() => {
      ids.forEach((id, i) => {
        conversationPinColl.update(id, (draft) => {
          draft.sort_order = i + 1;
        });
      });
    });
  };
  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>置顶</SidebarGroupLabel>
        <DragDropProvider onDragEnd={handlePinDragEnd}>
          <SidebarMenu>
            {pinChats.map((chat, index) => (
              <SortablePinItem
                key={chat.id}
                index={index}
                chat={{ id: chat.id!, title: chat.title }}
                isActive={pathname === `/chat/${chat.id}`}
                pinned
                onRename={saveTitle}
                onTogglePin={togglePin}
                onArchive={archiveChat}
              />
            ))}
          </SidebarMenu>
        </DragDropProvider>
      </SidebarGroup>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>{t("chat.recent")}</SidebarGroupLabel>
        <SidebarMenu>
          {allChats.map((chat) => (
            <ChatSidebarItem
              key={chat.id}
              chat={chat}
              isActive={pathname === `/chat/${chat.id}`}
              pinned={pinnedSet.has(chat.id)}
              onRename={saveTitle}
              onTogglePin={togglePin}
              onArchive={archiveChat}
            />
          ))}
          <SidebarMenuItem>
            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <span className="px-2 py-1 text-xs text-muted-foreground">
                {t("common.loading")}
              </span>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
};

export default NavHistoryChat;
