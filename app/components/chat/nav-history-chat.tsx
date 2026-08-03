import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { useLiveInfiniteQuery } from "@tanstack/react-db";
import { conversationColl } from "~/db/tdb-collections";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

const PAGE_SIZE = 30;

const NavHistoryChat = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { pages, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLiveInfiniteQuery(
      (q) =>
        q
          .from({ conversationColl })
          .orderBy(
            ({ conversationColl }) => conversationColl.created_at,
            "desc",
          ),
      { pageSize: PAGE_SIZE },
      [],
    );
  const allChats = pages.flat();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 用 ref 存 fetchNextPage，避免 Observer 因回调引用变化而重建
  const fetchNextPageRef = useRef(fetchNextPage);
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = sentinel.closest<HTMLElement>(
      '[data-slot="sidebar-content"]',
    );
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

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦编辑输入框
  useEffect(() => {
    if (editId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editId]);

  const saveTitle = (id: string) => {
    const trimmed = editTitle.trim();
    if (trimmed) {
      conversationColl.update(id, (draft) => {
        draft.title = trimmed;
        draft.updated_at = new Date();
      });
    }
    setEditId(null);
  };
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("chat.recent")}</SidebarGroupLabel>
      <SidebarMenu>
        {allChats.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton
              asChild
              isActive={pathname === `/chat/${chat.id}`}
              onDoubleClick={(e) => {
                setEditId(chat.id);
                setEditTitle(chat.title);
              }}
            >
              {editId === chat.id ? (
                <input
                  ref={editInputRef}
                  defaultValue={chat.title}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle(chat.id);
                    if (e.key === "Escape") setEditId(null);
                  }}
                  onBlur={() => saveTitle(chat.id)}
                  className="w-full truncate border-0 bg-transparent p-0 text-inherit shadow-none outline-none ring-0 focus-visible:ring-0"
                />
              ) : (
                <Link to={`/chat/${chat.id}`} className="truncate">
                  {chat.title}
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
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
  );
};

export default NavHistoryChat;
