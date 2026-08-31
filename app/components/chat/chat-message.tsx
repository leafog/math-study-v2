import { memo, type ComponentProps, useMemo, useCallback } from "react";
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
import { AttachmentGroup } from "../ui/attachment";
import { eq, inArray, queryOnce, useLiveQuery } from "@tanstack/react-db";
import {
  attachmentChatRelColl,
  attachmentColl,
  attachmentMetaDataColl,
  problemColl,
} from "~/db/tdb-collections";
import AttachmentsReadonlyList from "./attachments-readonly-list";
import type { Attachment } from "~/db/db-zod-schema";
import type { AttachmentWithMetaData } from "../common-ui/indexed-url-preview";

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

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
    // 新消息只存 id；老消息可能在 metadata 里存了完整题目，作为兜底
    const practiceProblemIds = message.metadata?.practiceProblemIds ?? [];
    const legacyProblems = message.metadata?.practiceProblems ?? [];
    const messageId = message.metadata?.message_id ?? message.id;

    const { data: problemsByIds = [] } = useLiveQuery(
      (q) => {
        if (practiceProblemIds.length === 0) return undefined;
        return q
          .from({ problemColl })
          .where(({ problemColl }) =>
            inArray(problemColl.id, practiceProblemIds),
          );
      },
      [practiceProblemIds],
    );

    const practiceProblems =
      practiceProblemIds.length > 0 ? problemsByIds : legacyProblems;

    const attachmentIds = message.metadata?.attachmentIds ?? [];
    const { data: attachments = [] } = useLiveQuery(
      (q) => {
        if (attachmentIds.length === 0) return undefined;
        return q
          .from({ attachmentChatRelColl })
          .join(
            { attachmentColl },
            ({ attachmentChatRelColl, attachmentColl }) =>
              eq(attachmentChatRelColl.attachment_id, attachmentColl.id),
          )
          .join(
            { attachmentMetaDataColl },
            ({ attachmentColl, attachmentMetaDataColl }) =>
              eq(attachmentColl.id, attachmentMetaDataColl.id),
          )
          .where(({ attachmentChatRelColl }) =>
            eq(attachmentChatRelColl.message_id, messageId),
          )
          .orderBy(
            ({ attachmentChatRelColl }) => attachmentChatRelColl.sort_order,
            "asc",
          )
          .select(({ attachmentColl, attachmentMetaDataColl }) => ({
            ...attachmentColl,
            meta_data: attachmentMetaDataColl,
          }));
      },
      [attachmentIds],
    );

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

    const textFromParts = useMemo(() => {
      if (isAnimating) return "";
      return message.parts
        ?.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n")
        .trim();
    }, [message.parts, isAnimating]);

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

    if (isThinking) {
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
                <div className="ml-auto justify-end max-w-full">
                  <ProblemsAttachmentList problems={practiceProblems} />
                </div>
              )}
              {attachmentIds.length > 0 && (
                <div className="ml-auto justify-end max-w-full">
                  <AttachmentsReadonlyList
                    attachments={attachments as AttachmentWithMetaData[]}
                  />
                </div>
              )}
              {filteredParts.map((part, i) => {
                const key = `message-${message.id}-part-${i}`;
                if (part.type === "text" && part.text.length > 0) {
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
                  console.log(part.mediaType);
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
        {!isAnimating && (
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
        )}
      </div>
    );

    return content;
  },
);

export default PureChatMessage;
