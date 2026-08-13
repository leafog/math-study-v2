import { useBoolean } from "usehooks-ts";
import { useTranslation } from "react-i18next";
import { Brain } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import type { LLMreasoning } from "~/lib/agent/types";

const REASONING_OPTIONS: LLMreasoning[] = [
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

const ChatPromptModelThinkingEffort = () => {
  const { t } = useTranslation();
  const { value: open, setValue: setOpen } = useBoolean(false);
  const reasoning = useChatPromptInput().use.reasoning();
  const setReasoning = useChatPromptInput().use.setReasoning();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={"outline"} className="rounded-full">
          <Brain size={16} />
          {t(`chat.reasoningEffort.${reasoning}`)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuRadioGroup
          value={reasoning}
          onValueChange={(value) => setReasoning(value as LLMreasoning)}
        >
          {REASONING_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {t(`chat.reasoningEffort.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatPromptModelThinkingEffort;
