import { ChefHat, Files, Languages, Moon, Plus, Sun } from "lucide-react";
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
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import NavHistoryChat from "./nav-history-chat";

type RouteItem = {
  path: string;
  title: string;
  icon: React.ReactElement;
};

const AppSidebar = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
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
      path: "/file",
      icon: <Files />,
      title: t("routes.files"),
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
      <SidebarContent className="scrollbar-thin">
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
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="hidden dark:block" />
              <Moon className="block dark:hidden" />
              <span>
                {theme === "dark" ? t("settings.light") : t("settings.dark")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() =>
                i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh")
              }
            >
              <Languages />
              <span>{i18n.language === "zh" ? "EN" : "中文"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
