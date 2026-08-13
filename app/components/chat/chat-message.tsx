import {
  memo,
  type ComponentProps,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "../ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Shimmer } from "../ai-elements/shimmer";
import { Button } from "../ui/button";
import { CopyIcon, FileIcon } from "lucide-react";
import { useCopyToClipboard } from "usehooks-ts";
import { toast } from "sonner";

import { isToolPart, renderToolPart } from "~/lib/agent/tools/tools-ui";
import { useTranslation } from "react-i18next";
import type { UIChatMessage } from "~/lib/agent/types";
import { formatMessageTime } from "~/lib/date-utils";
import { cn } from "~/lib/utils";
import { Marker, MarkerContent, MarkerIcon } from "../ui/marker";
import { Spinner } from "../ui/spinner";
import type { ChatStatus } from "ai";

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

const PureChatMessage = memo(
  ({
    message,
    isAnimating = false,
    status,
  }: {
    message: UIChatMessage;
    isAnimating?: boolean;
    status: ChatStatus;
  }) => {
    const { t } = useTranslation();

    const isUser = message.role === "user";
    const align = isUser ? "end" : "start";
    const [_, copyToClipboard] = useCopyToClipboard();

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

    if (message.parts.length === 0) {
      return null;
    }

    if (message.parts.length === 1 && message.parts[0].type === "step-start") {
      return (
        <Marker role="status">
          <MarkerIcon>
            <Spinner />
          </MarkerIcon>
          <MarkerContent className="shimmer">
            {t("chat.thinking")}
          </MarkerContent>
        </Marker>
      );
    }

    return (
      <div className="group">
        <Message from={message.role} key={message.id}>
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
                      <ReasoningContent>{(part as any).text}</ReasoningContent>
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
        </Message>

        <MessageActions
          className={cn(
            "opacity-0 gap-2 group-hover:opacity-100 transition-opacity",
            isUser ? "ml-auto justify-end" : "",
          )}
        >
          <MessageAction label="Copy" onClick={handleCopy} tooltip="copy">
            <CopyIcon />
          </MessageAction>
          {!isAnimating && message.metadata?.created_at && (
            <span className="text-sm">
              {formatMessageTime(message.metadata.created_at, t)}
            </span>
          )}
        </MessageActions>
      </div>
    );
  },
);

export default PureChatMessage;
