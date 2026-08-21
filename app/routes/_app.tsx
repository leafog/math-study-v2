import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router";
import AppSidebar from "~/components/chat/app-sider";
import ChatShell from "~/components/chat/chat-shell";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { initDb } from "~/db/pw-db";
import { zustandStorageColl } from "~/db/tdb-collections";
import { ActiveChatProvider } from "~/hooks/chat/active-chat";

import { initWorkerApi } from "~/lib/similar";
import { cn } from "~/lib/utils";
import i18n from "~/lib/i18n";
import { useSync } from "~/hooks/use-sync";
import { useI18nStore } from "~/store/i18n-store";

// 页面加载时立即启动 Worker（WASM 预热 + IndexedDB 加载），
// 避免首次 AI 工具调用时冷启动延迟
initWorkerApi();
initDb();

const AppLayout = () => {
  const { pathname } = useLocation();

  useLiveSuspenseQuery((q) => {
    return q
      .from({ zustandStorageColl })
      .where(({ zustandStorageColl }) => eq(zustandStorageColl.id, "none"))
      .findOne();
  }, []);

  const { i18n } = useTranslation();

  const setLocale = useI18nStore.use.setLocale();
  // 外部获取
  useSync(i18n.language, setLocale);

  const hiddenRoutes = ["/library", "/graph", "/problem", "/settings"];
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="border-l border-border  w-full overflow-hidden overscroll-none">
        <div className="h-screen flex">
          <ActiveChatProvider>
            <div
              className={cn(
                "flex-1 absolute inset-0 transition-opacity duration-100",
                hiddenRoutes.includes(pathname)
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100",
              )}
            >
              <ChatShell />
            </div>
            <div className="flex flex-1 min-h-0">
              <Outlet />
            </div>
          </ActiveChatProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
