import {
  memo,
  type ComponentProps,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { MessageResponse } from "../ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Shimmer } from "../ai-elements/shimmer";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent, MessageFooter } from "../ui/message";
import { Button } from "../ui/button";
import { CopyIcon, FileIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import confetti from "canvas-confetti";
import { isToolPart, renderToolPart } from "~/lib/agent/tools/tools-ui";
import { useTranslation } from "react-i18next";
import type { UIChatMessage } from "~/lib/agent/types";
import { formatMessageTime } from "~/lib/date-utils";
import { Marker, MarkerContent, MarkerIcon } from "../ui/marker";
import { Spinner } from "../ui/spinner";

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
    const { t } = useTranslation();

    const getThinkingMessage = useCallback(
      (isStreaming: boolean, duration?: number) => {
        if (isStreaming || duration === 0) {
          return <Shimmer duration={1}>{t("chat.reasoning.thinking")}</Shimmer>;
        }
        if (duration === undefined) {
          return <p>{t("chat.reasoning.fewSeconds")}</p>;
        }
        return <p>{t("chat.reasoning.seconds", { count: duration })}</p>;
      },
      [t],
    );

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

    const filteredParts = useMemo(
      () => message.parts.filter((part) => part.type !== "step-start"),
      [message.parts],
    );

    const hasContent = useMemo(
      () =>
        message.parts?.some(
          (part) =>
            (part.type === "text" && (part.text?.trim().length ?? 0) > 0) ||
            (part.type === "reasoning" &&
              "text" in part &&
              ((part as { text: string }).text?.trim().length ?? 0) > 0) ||
            part.type.startsWith("tool-"),
        ),
      [message.parts],
    );
    const isThinking = isAnimating && !isUser && !hasContent;

    return (
      <div className="group">
        <Message align={align}>
          <MessageContent>
            <Bubble variant={isUser ? "muted" : "ghost"} className="max-w-full">
              <BubbleContent className="typeset typeset-chat">
                {isThinking ? (
                  <Marker role="status">
                    <MarkerIcon>
                      <Spinner />
                    </MarkerIcon>
                    <MarkerContent className="shimmer">
                      {t("chat.thinking")}
                    </MarkerContent>
                  </Marker>
                ) : (
                  <>
                    {filteredParts.map((part, i) => {
                      const key = `message-${message.id}-part-${i}`;
                      if (part.type === "text") {
                        return (
                          <MessageContent key={key}>
                            <MessageResponse
                              isAnimating={part.state === "streaming"}
                              caret="block"
                            >
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                        );
                      }
                      if (part.type === "file") {
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
                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            key={key}
                            isStreaming={part.state === "streaming"}
                            duration={(part as any)._duration}
                            className="w-full"
                          >
                            <ReasoningTrigger
                              getThinkingMessage={getThinkingMessage}
                              className="[&>p]:m-0"
                            />
                            <ReasoningContent>
                              {(part as any).text}
                            </ReasoningContent>
                          </Reasoning>
                        );
                      }
                      if (isToolPart(part)) {
                        return <div key={key}>{renderToolPart(part)}</div>;
                      }
                      return null;
                    })}
                  </>
                )}
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
              {message.metadata?.created_at && (
                <span>{formatMessageTime(message.metadata.created_at, t)}</span>
              )}
            </MessageFooter>
          </MessageContent>
        </Message>
      </div>
    );
  },
);

export default PureChatMessage;
