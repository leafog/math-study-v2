import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import { ButtonGroup } from "../ui/button-group";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import ChatHeaderContainer from "./chat-header-container";
import ToolsToggleBtn from "./tools-toggle-btn";
import ToolsZentoggleBtn from "./tools-zen-toogle-btn";

interface ToolsPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
}

const ToolsPanel = ({ panelRef }: ToolsPanelProps) => {
  const onToolsResize = useChatToolsPanelStore.use.onToolsResize();
  const toolsShow = useChatToolsPanelStore.use.toolsShow();

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"0%"}
      minSize={"25%"}
      collapsible
      onResize={(size) => onToolsResize(size)}
      className="flex flex-col w-full"
    >
      <ChatHeaderContainer>
        <div className="h-14"></div>
        <ButtonGroup></ButtonGroup>
        {toolsShow && (
          <div className="flex gap-2">
            <ToolsZentoggleBtn />
            <ToolsToggleBtn />
          </div>
        )}
      </ChatHeaderContainer>
      <div>info</div>
    </ResizablePanel>
  );
};

export default ToolsPanel;
