import { Button } from "../ui/button";
import { PanelRight, PanelRightDashed } from "lucide-react";
import { useActiveChatToolsPanelStore } from "~/hooks/chat/active-chat";

interface ToolsTriggerProps {
  onTrigger: VoidFunction;
  inTools?: boolean;
}

const ToolsToggleBtn = () => {
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const toolsShowToggle = useActiveChatToolsPanelStore().use.toolsShowToggle();
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
