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
import type { UIMessage } from "ai";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import { CopyIcon, FileIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import ProblemView from "../math/problem";
import type { Problem } from "~/db/db-zod-schema";
import confetti from "canvas-confetti";

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

// ── 工具调用内联标签 ──

function ToolCallLabel({
  state,
  loadingKey,
  doneText,
  errorKey,
}: Readonly<{
  state: string;
  loadingKey: string;
  doneText?: string | null;
  errorKey?: string;
}>) {
  const { t } = useTranslation();

  if (state === "output-error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive py-1">
        <span className="text-[10px]">✕</span>
        <span>{t(errorKey!, t("toolCall.execFailed"))}</span>
      </div>
    );
  }

  if (state === "output-available") {
    if (!doneText) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary py-1">
        <span>✓</span>
        <span>{doneText}</span>
      </div>
    );
  }

  // input-streaming | input-available → loading
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
      <Spinner className="size-3" />
      <span>{t(loadingKey)}</span>
    </div>
  );
}

const PureChatMessage = memo(
  ({
    message,
    isAnimating = false,
  }: {
    message: UIMessage;
    isAnimating?: boolean;
  }) => {
    const { t } = useTranslation();

    // Confetti when answer is correct (only for live messages, not history)
    const confettiFiredRef = useRef(false);
    useEffect(() => {
      if (!isAnimating) return;
      if (confettiFiredRef.current) return;
      const correct = message.parts?.some(
        (p) =>
          p.type === "tool-checkAnswer" &&
          p.state === "output-available" &&
          (p as { output?: { correct?: boolean } }).output?.correct,
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
          // ── Tool: createProblem ──
          if (type === "tool-createProblem") {
            const toolPart = part;
            if (toolPart.state === "output-available") {
              const r = toolPart.output as Problem;
              return (
                <div key={key} id={`problem-${r.id}`}>
                  <ProblemView
                    id={r.id}
                    content={r.content}
                    description={r.description}
                    source={r.source}
                  />
                </div>
              );
            }
            return (
              <ToolCallLabel
                key={key}
                state={toolPart.state}
                loadingKey="toolCall.creatingProblem"
                errorKey="toolCall.createProblemFailed"
              />
            );
          }

          // ── Tool: createTopic ──
          if (type === "tool-createTopic") {
            const toolPart = part;
            const doneText =
              toolPart.state === "output-available"
                ? (toolPart.output as { created?: boolean })?.created
                  ? t("toolCall.topicRecorded")
                  : t("toolCall.topicLinked")
                : undefined;
            return (
              <ToolCallLabel
                key={key}
                state={toolPart.state}
                loadingKey="toolCall.recordingTopic"
                doneText={doneText}
                errorKey="toolCall.recordTopicFailed"
              />
            );
          }

          // ── Tool: createRelationship ──
          if (type === "tool-createRelationship") {
            const toolPart = part;
            return (
              <ToolCallLabel
                key={key}
                state={toolPart.state}
                loadingKey="toolCall.buildingRelation"
                doneText={t("toolCall.relationBuilt")}
                errorKey="toolCall.buildRelationFailed"
              />
            );
          }

          // ── Tool: checkAnswer ──
          if (type === "tool-checkAnswer") {
            const toolPart = part;
            const doneText =
              toolPart.state === "output-available"
                ? (toolPart.output as { correct?: boolean })?.correct
                  ? t("toolCall.answerCorrect")
                  : t("toolCall.answerWrong")
                : undefined;
            return (
              <ToolCallLabel
                key={key}
                state={toolPart.state}
                loadingKey="toolCall.checkingAnswer"
                doneText={doneText}
                errorKey="toolCall.checkAnswerFailed"
              />
            );
          }

          return <div key={key}>{part.type}</div>;
        }),
      [message.parts, message.id, isAnimating, t],
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
  },
);

export default PureChatMessage;
