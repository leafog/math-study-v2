import { Menu } from "lucide-react";
import { Button } from "../ui/button";
import {
  useActiveChatToolsPanelStore,
} from "~/hooks/chat/active-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ChatKnowledgeGraph from "./chat-kg-graph";

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
      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
          知识点图谱
        </div>
        <div className="h-48">
          <ChatKnowledgeGraph />
        </div>
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
