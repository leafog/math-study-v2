import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../ui/button";
import { useActiveChatToolsPanelStore } from "~/hooks/chat/active-chat";

const ToolsZentoggleBtn = () => {
  const zenMode = useActiveChatToolsPanelStore().use.zenMode();
  const zenModeToggle = useActiveChatToolsPanelStore().use.zenModeToggle();
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
