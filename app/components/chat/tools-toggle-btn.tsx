import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { Button } from "../ui/button";
import { PanelRight, PanelRightDashed } from "lucide-react";

interface ToolsTriggerProps {
  onTrigger: VoidFunction;
  inTools?: boolean;
}

const ToolsToggleBtn = () => {
  const toolsShow = useChatToolsPanelStore.use.toolsShow();
  const toolsShowToggle = useChatToolsPanelStore.use.toolsShowToggle();
  return (
    <Button
      size="icon"
      variant={toolsShow ? "outline" : "ghost"}
      onClick={toolsShowToggle}
    >
      {toolsShow ? <PanelRight /> : <PanelRightDashed />}
    </Button>
  );
};

export default ToolsToggleBtn;
