import type { CSSProperties } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "../ui/sidebar";

const SidebarRight = () => {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-full border-l-0 lg:flex"
      style={
        {
          "--sidebar-width": "",
        } as CSSProperties
      }
    >
      <SidebarHeader>知识图谱s</SidebarHeader>
      <SidebarContent>content</SidebarContent>
      <SidebarFooter>footer</SidebarFooter>
    </Sidebar>
  );
};

export default SidebarRight;
