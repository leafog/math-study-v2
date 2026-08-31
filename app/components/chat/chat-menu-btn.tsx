import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useActiveChatToolsPanelStore } from "~/hooks/chat/active-chat";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import ChatMenuInfo from "./chat-menu-info";
import { useClickAway } from "@uidotdev/usehooks";
import { bus, useRxEvent } from "~/event/events";

const ChatMenuBtn = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();
  const menuShowToggle = useActiveChatToolsPanelStore().use.menuShowToggle();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const ref = useClickAway<HTMLDivElement>((e) => {
    if (
      (e.target as HTMLElement | null)?.closest("#tools-show-popover-trigger")
    ) {
      return;
    }
    setPopoverOpen(false);
  });

  useRxEvent("topic:in-chat-view-topic", true, (id) => {
    if (toolsShow) {
      if (popoverOpen) {
        return;
      } else {
        setPopoverOpen(true);
      }
      setTimeout(() => {
        bus.emit("topic:in-chat-view-topic", id);
      }, 200);
    } else {
      if (menuShow) {
        return;
      }
      menuShowToggle();
      setTimeout(() => {
        bus.emit("topic:in-chat-view-topic", id);
      }, 200);
    }
  });

  return toolsShow ? (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild id="tools-show-popover-trigger">
        <Button
          size="icon"
          variant={"ghost"}
          onClick={(e) => setPopoverOpen(true)}
        >
          <Menu />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-xs" asChild>
        <div ref={ref} style={{ display: "contents" }}>
          <ChatMenuInfo className="w-xs" />
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
