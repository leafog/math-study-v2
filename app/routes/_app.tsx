import { Outlet } from "react-router";
import AppSidebar from "~/components/chat/app-sider";
import ChatShell from "~/components/chat/chat-shell";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { ActiveChatProvider } from "~/hooks/chat/active-chat";

const AppLayout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="border-l border-border  w-full overflow-hidden">
        <div className="h-screen">
          <ActiveChatProvider>
            <ChatShell />
          </ActiveChatProvider>
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
