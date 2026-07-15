import { useMemo } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import ChatHeaderContainer from "./chat-header-container";
import ToolsToggleBtn from "./tools-toggle-btn";
import ToolsZentoggleBtn from "./tools-zen-toogle-btn";
import ToolsGreeting from "./tools-greeting";
import ToolsBar from "./tools-bar";
import {
  useActiveChatToolsPanelStore,
  useChatTools,
} from "~/hooks/chat/active-chat";
import { kindToTool } from "./tools";
import { cn } from "~/lib/utils";

interface ToolsPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
}

// TODO: 工具 Panel 可通过 data-active 属性感知激活状态自行聚焦
// 例: 父容器 [data-active="true"] 时调用 apiRef.current?.focus()
const ToolPanelContent = ({ kind }: { kind: string }) => {
  const { Panel } = kindToTool(kind)!;
  return <Panel />;
};
const ToolsPanel = ({ panelRef }: ToolsPanelProps) => {
  const onToolsResize = useActiveChatToolsPanelStore().use.onToolsResize();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const { tools, hasTools, activeId, mountedTools } = useChatTools();

  const activeIndex = useMemo(
    () => mountedTools.findIndex((t) => t.id === activeId),
    [mountedTools, activeId],
  );

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"0%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onToolsResize(size)}
      className="flex flex-col w-full "
    >
      <ChatHeaderContainer>
        <div className=" overflow-hidden">
          <ToolsBar />
        </div>

        {toolsShow && (
          <div className="flex gap-2">
            <ToolsZentoggleBtn />
            <ToolsToggleBtn />
          </div>
        )}
      </ChatHeaderContainer>
      <div className="flex-1 size-full relative overflow-hidden">
        {!hasTools ? (
          <ToolsGreeting />
        ) : (
          mountedTools.map(({ kind, id }) => {
            const isActive = id === activeId;
            return (
              <div
                key={id}
                data-panel-id={id}
                data-active={isActive}
                className={cn(
                  "size-full absolute inset-0 transition-opacity duration-300",
                  isActive
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none",
                )}
              >
                <ToolPanelContent kind={kind} />
              </div>
            );
          })
        )}
      </div>
    </ResizablePanel>
  );
};

export default ToolsPanel;
