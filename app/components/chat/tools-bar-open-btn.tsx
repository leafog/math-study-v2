import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toolRegistry } from "./tools";
import { useChatTools } from "~/hooks/chat/active-chat";
import { genId } from "~/lib/id-utils";

const ToolsBarOpenBtn = () => {
  const { open } = useChatTools();
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="sticky right-0 pr-2 bg-background">
          <Button size="icon" variant={"ghost"}>
            <Plus />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-1">
        {toolRegistry.map(({ kind, Icon }) => (
          <Button
            className="w-full justify-start"
            size="lg"
            key={kind}
            variant={"ghost"}
            onClick={() => {
              open(kind, "title" + genId());
              setPopoverOpen(false);
            }}
          >
            <Icon />
            <span>{kind}</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ToolsBarOpenBtn;
