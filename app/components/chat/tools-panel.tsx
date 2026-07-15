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

const ToolsPanel = ({ panelRef }: ToolsPanelProps) => {
  const onToolsResize = useActiveChatToolsPanelStore().use.onToolsResize();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const { tools, hasTools, activeId, mountedTools } = useChatTools();

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
      <div className="flex-1 size-full">
        {!hasTools && <ToolsGreeting />}
        {mountedTools.map(({ kind, id }) => {
          const { Panel } = kindToTool(kind)!;
          return (
            <div
              className={cn("size-full", id === activeId ? "" : "hidden")}
              key={id}
            >
              <Panel />
            </div>
          );
        })}
      </div>
    </ResizablePanel>
  );
};

export default ToolsPanel;
