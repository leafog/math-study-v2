import {
  ChartScatter,
  ChefHat,
  Files,
  Plus,
  BadgeQuestionMark,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import NavHistoryChat from "./nav-history-chat";

type RouteItem = {
  path: string;
  title: string;
  icon: React.ReactElement;
};

const AppSidebar = () => {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const isOpen = state === "expanded";

  const topRoutes: RouteItem[] = [
    {
      path: "/",
      icon: <ChefHat />,
      title: t("chat.newChat"),
    },
    {
      path: "/library",
      icon: <Files />,
      title: t("routes.files"),
    },
    {
      path: "/graph",
      icon: <ChartScatter />,
      title: t("routes.graph"),
    },
    {
      path: "/problem",
      icon: <BadgeQuestionMark />,
      title: t("problem.title"),
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="group-data-[side=left]:border-r-0  bg-current"
    >
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center",
            isOpen ? "justify-between" : "justify-center",
          )}
        >
          <div className="group/h ">
            <div
              className={
                isOpen ? "" : "flex-1 items-center group-hover/h:hidden"
              }
            >
              <Button variant={"ghost"} size="icon-sm">
                <Plus />
              </Button>
            </div>
            {!isOpen && (
              <div className="hidden group-hover/h:block">
                <SidebarTrigger />
              </div>
            )}
          </div>
          {isOpen && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin overscroll-none">
        <SidebarGroup className="sticky top-0 bg-background z-50 ">
          <SidebarMenu>
            {topRoutes.map(({ path, icon, title }) => {
              return (
                <SidebarMenuItem key={path}>
                  <Link to={path}>
                    <SidebarMenuButton isActive={pathname === path}>
                      {icon}
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
        <NavHistoryChat />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings />
                <span>{t("settings.title")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
