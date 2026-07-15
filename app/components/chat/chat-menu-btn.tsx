import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { useActiveChatToolsPanelStore } from "~/hooks/chat/active-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const ChatMenuBtn = () => {
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();
  const menuShowToggle = useActiveChatToolsPanelStore().use.menuShowToggle();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();

  return toolsShow ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant={"ghost"}>
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div>123</div>
      </PopoverContent>
    </Popover>
  ) : (
    <Button
      size="icon"
      variant={menuShow ? "outline" : "ghost"}
      onClick={menuShowToggle}
    >
      <Menu />
    </Button>
  );
};

export default ChatMenuBtn;
