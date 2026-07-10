import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../ui/button";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";

const ToolsZentoggleBtn = () => {
  const zenMode = useChatToolsPanelStore.use.zenMode();
  const zenModeToggle = useChatToolsPanelStore.use.zenModeToggle();
  return (
    <Button
      size="icon"
      variant={zenMode ? "outline" : "ghost"}
      onClick={zenModeToggle}
    >
      {zenMode ? <Minimize2 /> : <Maximize2 />}
    </Button>
  );
};

export default ToolsZentoggleBtn;
