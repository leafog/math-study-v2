import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useActiveChatToolsPanelStore } from "~/hooks/chat/active-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ChatMenuInfo from "./chat-menu-info";

const ChatMenuBtn = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();
  const menuShowToggle = useActiveChatToolsPanelStore().use.menuShowToggle();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();

  return toolsShow ? (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant={"ghost"}>
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" asChild>
        <ChatMenuInfo />
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
