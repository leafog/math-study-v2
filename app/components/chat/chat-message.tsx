import {
  memo,
  type ComponentProps,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { MessageResponse } from "../ai-elements/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent, MessageFooter } from "../ui/message";
import { Button } from "../ui/button";
import { CopyIcon, FileIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import confetti from "canvas-confetti";
import { isToolPart, renderToolPart } from "~/lib/agent/tools/tools-ui";
import { useChatProblems } from "~/hooks/chat/active-chat";
import type { UIChatMessage } from "~/lib/agent/types";

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

const PureChatMessage = memo(
  ({
    message,
    isAnimating = false,
  }: {
    message: UIChatMessage;
    isAnimating?: boolean;
  }) => {
    // Confetti when answer is correct (only for live messages, not history)
    const confettiFiredRef = useRef(false);
    useEffect(() => {
      if (!isAnimating) return;
      if (confettiFiredRef.current) return;
      const correct = message.parts?.some(
        (p) =>
          p.type === "tool-checkAnswer" &&
          p.state === "output-available" &&
          p.output?.correct,
      );
      if (correct) {
        confettiFiredRef.current = true;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }, [message.parts, isAnimating]);

    const isUser = message.role === "user";
    const align = isUser ? "end" : "start";
    const [_, copyToClipboard] = useCopyToClipboard();

    const textFromParts = useMemo(
      () =>
        message.parts
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n")
          .trim(),
      [message.parts],
    );

    const handleCopy = useCallback(async () => {
      if (!textFromParts) {
        toast.error("There's no text to copy!", { position: "top-center" });
        return;
      }
      await copyToClipboard(textFromParts);
      toast.success("Copied to clipboard!", { position: "top-center" });
    }, [textFromParts, copyToClipboard]);

    const parts = useMemo(
      () =>
        message.parts.map((part, i) => {
          const { type } = part;
          const key = `message-${message.id}-part-${i}`;
          if (type === "reasoning") {
            return <div key={key}>reasoning</div>;
          }
          if (type === "text") {
            return (
              <MessageResponse
                key={key}
                isAnimating={isAnimating}
                caret="block"
              >
                {part.text}
              </MessageResponse>
            );
          }
          if (type === "file") {
            const isImage = part.mediaType.startsWith("image/");
            return (
              <div key={key} className="mb-2 last:mb-0">
                {isImage ? (
                  <img
                    src={part.url}
                    alt={part.filename ?? ""}
                    className="max-h-48 w-auto rounded-lg object-cover border"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {part.filename ?? "file"}
                    </span>
                  </div>
                )}
              </div>
            );
          }
          // ── Tool parts → registered renderers ──
          if (isToolPart(part)) {
            return <div key={key}>{renderToolPart(part)}</div>;
          }

          return <div key={key}>{part.type}</div>;
        }),
      [message.parts, message.id, isAnimating],
    );

    return (
      <div className="group">
        <Message align={align}>
          <MessageContent>
            <Bubble variant={isUser ? "muted" : "ghost"} className="max-w-full">
              <BubbleContent className="typeset typeset-chat">
                <MessageContent>{parts}</MessageContent>
              </BubbleContent>
            </Bubble>
            <MessageFooter className="opacity-0 gap-2 group-hover:opacity-100 transition-opacity">
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
              <span className="font-normal">
                {JSON.stringify(message.metadata) + "0000nu"}
              </span>
            </MessageFooter>
          </MessageContent>
        </Message>
      </div>
    );
  },
);

export default PureChatMessage;
