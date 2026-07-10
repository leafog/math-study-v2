import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import { ButtonGroup } from "../ui/button-group";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { Button } from "../ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import ChatHeaderContainer from "./chat-header-container";
import ToolsTrigger from "./tools-trigger";

const ZenModeButton = ({
  onZen,
  zen,
}: {
  onZen: VoidFunction;
  zen: boolean;
}) => {
  return (
    <Button size="icon" variant={zen ? "outline" : "ghost"} onClick={onZen}>
      {zen ? <Minimize2 /> : <Maximize2 />}
    </Button>
  );
};

interface ToolsPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  onToolsTrigger: VoidFunction;
}

const ToolsPanel = ({ panelRef, onToolsTrigger }: ToolsPanelProps) => {
  const onToolsResize = useChatToolsPanelStore.use.onToolsResize();
  const toolsClosed = useChatToolsPanelStore.use.toolsClosed();
  const toolsZenMod = useChatToolsPanelStore.use.toolsZenMod();
  const toolsZenModTrigger = useChatToolsPanelStore.use.toolsZenModTrigger();

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
        {!toolsClosed && (
          <div className="flex gap-2">
            <ZenModeButton onZen={toolsZenModTrigger} zen={toolsZenMod} />
            <ToolsTrigger onTrigger={onToolsTrigger} inTools />
          </div>
        )}
      </ChatHeaderContainer>
      <div>info</div>
    </ResizablePanel>
  );
};

export default ToolsPanel;
