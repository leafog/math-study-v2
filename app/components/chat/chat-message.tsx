import {
  memo,
  useEffect,
  type ComponentProps,
  type PropsWithChildren,
} from "react";
import { MessageResponse } from "../ai-elements/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent, MessageFooter } from "../ui/message";
import type { UIMessage } from "ai";
import { Marker, MarkerIcon, MarkerContent } from "../ui/marker";
import { Spinner } from "../ui/spinner";
import { Button } from "../ui/button";
import { CopyIcon, ThumbsUpIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

const PureChatMessage = ({ message }: { message: UIMessage }) => {
  const align = message.role === "user" ? "end" : "start";
  const [_, copyToClipboard] = useCopyToClipboard();

  const textFromParts = message.parts
    ?.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!", { position: "top-center" });
      return;
    }
    await copyToClipboard(textFromParts);
    toast.success("Copied to clipboard!", { position: "top-center" });
  };

  return (
    <div className="group">
      <Message align={align}>
        <MessageContent className="w-full">
          <Bubble variant={"ghost"} className=" max-w-full">
            <BubbleContent className="w-full">
              {message.parts.length === 1 &&
                message.parts[0].type === "step-start" && <div>reading</div>}
              {message.parts
                .filter((it) => it.type === "text")
                .map((it, i) => (
                  <MessageResponse className="w-full" key={i}>
                    {it.text}
                  </MessageResponse>
                ))}
            </BubbleContent>
          </Bubble>
          <MessageFooter className="opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageAction
              variant="ghost"
              size="icon"
              aria-label="Copy"
              title="Copy"
              onClick={handleCopy}
              tooltip="copy"
            >
              <CopyIcon />
            </MessageAction>
          </MessageFooter>
        </MessageContent>
      </Message>
    </div>
  );
};

export default PureChatMessage;
