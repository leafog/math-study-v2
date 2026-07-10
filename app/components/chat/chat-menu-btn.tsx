import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import { useChatMenuBtnStore } from "~/store/chat-menu-store";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const ChatMenuBtn = () => {
  const value = useChatMenuBtnStore.use.value();
  const toggle = useChatMenuBtnStore.use.toggle();
  const toolsShow = useChatToolsPanelStore.use.toolsShow();

  return toolsShow ? (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant={"ghost"} onClick={toggle}>
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div>123</div>
      </PopoverContent>
    </Popover>
  ) : (
    <Button size="icon" variant={value ? "outline" : "ghost"} onClick={toggle}>
      <Menu />
    </Button>
  );
};

export default ChatMenuBtn;
