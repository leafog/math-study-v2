import { useEffect, useRef } from "react";
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
            ({ conversationColl }) => conversationColl.updated_at,
            "desc",
          ),
      { pageSize: PAGE_SIZE },
      [],
    );

  const allChats = pages.flat();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const root = sentinel.closest<HTMLElement>('[data-slot="sidebar-content"]');
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root, rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("chat.recent")}</SidebarGroupLabel>
      <SidebarMenu>
        {allChats.map((chat) => (
          <SidebarMenuItem key={chat.id}>
            <SidebarMenuButton
              asChild
              isActive={pathname === `/chat/${chat.id}`}
            >
              <Link to={`/chat/${chat.id}`} className="truncate">
                {chat.title}
              </Link>
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
