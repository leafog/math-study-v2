import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { toolRegistry } from "./tools";
import { useChatTools } from "~/hooks/chat/active-chat";

const ToolsBarOpenBtn = () => {
  const { t } = useTranslation();
  const { open, tools } = useChatTools();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const kindEnd = (kind: string) => {
    const kindLength = tools.filter((it) => it.kind === kind).length;
    return kindLength >= 1 ? `${kindLength + 1}` : "";
  };
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
              open(kind, ` ${t("tools." + kind)} ${kindEnd(kind)}`);
              setPopoverOpen(false);
            }}
          >
            <Icon />
            <span>{t("tools." + kind)}</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ToolsBarOpenBtn;
