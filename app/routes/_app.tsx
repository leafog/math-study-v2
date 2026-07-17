import { Outlet, useLocation } from "react-router";
import AppSidebar from "~/components/chat/app-sider";
import ChatShell from "~/components/chat/chat-shell";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ActiveChatProvider } from "~/hooks/chat/active-chat";
import { cn } from "~/lib/utils";

const AppLayout = () => {
  const { pathname } = useLocation();
  const isLibrary = pathname === "/library";
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="border-l border-border  w-full overflow-hidden">
        <div className="h-screen ">
          <div
            className={cn(
              "size-full absolute inset-0 transition-opacity duration-200",
              isLibrary ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <ActiveChatProvider>
              <ChatShell />
            </ActiveChatProvider>
          </div>
          <div>
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
