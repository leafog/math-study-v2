import { Outlet, useLocation } from "react-router";
import AppSidebar from "~/components/chat/app-sider";
import ChatShell from "~/components/chat/chat-shell";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ActiveChatProvider } from "~/hooks/chat/active-chat";
import { cn } from "~/lib/utils";

import "katex/dist/katex.min.css";

const AppLayout = () => {
  const { pathname } = useLocation();
  const hiddenRoutes = ["/library", "/graph", "/problem"];
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="border-l border-border  w-full overflow-hidden">
        <div className="h-screen flex">
          <div
            className={cn(
              "flex-1 absolute inset-0 transition-opacity duration-100",
              hiddenRoutes.includes(pathname)
                ? "opacity-0 pointer-events-none"
                : "opacity-100",
            )}
          >
            <ActiveChatProvider>
              <ChatShell />
            </ActiveChatProvider>
          </div>
          <div className="flex flex-1 min-h-0">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
