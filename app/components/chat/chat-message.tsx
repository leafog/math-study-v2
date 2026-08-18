import {
  memo,
  type ComponentProps,
  type ReactNode,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  Message,
  MessageActions,
  MessageContent,
} from "../ai-elements/message";
import MathResBlock from "../math/math-res-block";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Shimmer } from "../ai-elements/shimmer";
import { Button } from "../ui/button";
import { FileIcon } from "lucide-react";

import { isToolPart, renderToolPart } from "~/lib/agent/tools/tools-ui";
import CopyButton from "../common-ui/copy-button";
import { useTranslation } from "react-i18next";
import type { UIChatMessage } from "~/lib/agent/types";
import { formatMessageTime } from "~/lib/date-utils";
import { cn } from "~/lib/utils";
import { Marker, MarkerContent, MarkerIcon } from "../ui/marker";
import { Spinner } from "../ui/spinner";
import type { ChatStatus } from "ai";
import { ProblemsAttachmentList } from "../math/problems-attachment-list";

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

// 已完成消息的渲染结果缓存:切回已看过的会话时直接复用 React 元素,
// React 对引用相等的元素会跳过整棵子树的重新渲染,从而跳过
// Streamdown 解析与 KaTeX 数学公式的重复计算(长公式消息切换卡顿的主因)。
// 只缓存非动画(已结束生成)的消息;消息 id 由 genId 生成,内容不可变。
const renderedMessageCache = new Map<string, ReactNode>();
const MAX_RENDERED_CACHE = 300;

const PureChatMessage = memo(
  ({
    message,
    isAnimating = false,
  }: {
    message: UIChatMessage;
    isAnimating?: boolean;
  }) => {
    const { t } = useTranslation();

    const isUser = message.role === "user";
    const align = isUser ? "end" : "start";
    const practiceProblems = message.metadata?.practiceProblems ?? [];

    const hasPracticeProblems = practiceProblems.length > 0;

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

    if (
      isThinking &&
      message.parts.length === 1 &&
      message.parts[0].type === "step-start"
    ) {
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

    // 缓存命中:已完成的消息直接复用之前的渲染结果
    if (!isAnimating) {
      const cached = renderedMessageCache.get(message.id);
      if (cached) return cached;
    }

    const content = (
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
              {hasPracticeProblems && (
                <div className="ml-auto justify-end">
                  <ProblemsAttachmentList problems={practiceProblems} />
                </div>
              )}
              {filteredParts.map((part, i) => {
                const key = `message-${message.id}-part-${i}`;
                if (part.type === "text") {
                  return (
                    <MessageContent key={key}>
                      <MathResBlock
                        isAnimating={part.state === "streaming"}
                        caret="block"
                      >
                        {part.text}
                      </MathResBlock>
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
                      className="w-full items-center my-auto"
                    >
                      <ReasoningTrigger
                        getThinkingMessage={getThinkingMessage}
                        className="[&>p]:m-0"
                      />
                      <ReasoningContent>{part.text}</ReasoningContent>
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
          <CopyButton text={textFromParts} />
          {!isAnimating && message.metadata?.created_at && (
            <span className="text-sm">
              {formatMessageTime(message.metadata.created_at, t)}
            </span>
          )}
        </MessageActions>
      </div>
    );

    if (!isAnimating) {
      renderedMessageCache.set(message.id, content);
      if (renderedMessageCache.size > MAX_RENDERED_CACHE) {
        const oldestKey = renderedMessageCache.keys().next().value;
        if (oldestKey !== undefined) {
          renderedMessageCache.delete(oldestKey);
        }
      }
    }

    return content;
  },
);

export default PureChatMessage;
