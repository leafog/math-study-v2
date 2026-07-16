import { useCallback } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "~/lib/utils";
import { useLiveInfiniteQuery, useLiveQuery } from "@tanstack/react-db";
import { conversationColl } from "~/db/tdb-collections";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Button } from "../ui/button";

const PAGE_SIZE = 30;

const NavHistoryChat = () => {
  const { pathname } = useLocation();
  const { pages, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLiveInfiniteQuery(
      (q) =>
        q
          .from({ conversationColl })
          .orderBy(
            ({ conversationColl }) => conversationColl.updatedAt,
            "desc",
          ),
      { pageSize: PAGE_SIZE },
      [],
    );

  const allChats = pages.flat();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>最近</SidebarGroupLabel>
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
        {hasNextPage && (
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={fetchNextPage}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "加载中..." : "加载更多"}
            </Button>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default NavHistoryChat;
