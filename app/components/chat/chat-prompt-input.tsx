import { useTranslation } from "react-i18next";
import { useActiveChat, useActiveChatHelpers } from "~/hooks/chat/active-chat";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  usePromptInputController,
  type PromptInputProps,
} from "~/components/chat/prompt-input";

import {
  attachmentChatRelColl,
  attachmentColl,
  attachmentMetaDataColl,
  attachmentTasksColl,
  chatMessageColl,
  problemColl,
} from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTrigger,
} from "../ui/attachment";
import { fileStore } from "~/db/indexdb-file-storage";

import {
  useToolSelectionStore,
  type ToolSelectionItem,
} from "./tools/store/tool-selection";
import { isEmpty, isUndefined, keyBy, values } from "lodash-es";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../ui/hover-card";
import MathRes from "../math/math-res";
import { useEffect, useMemo, useState } from "react";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { useChatPromptProblems } from "~/store/chat-prompt-problems";
import { useEvent } from "~/event/use-event";

import ChatPromptModelSelector from "./chat-prompt-model-selector";
import ChatPromptModelThinkingEffort from "./chat-prompt-model-thinking-effort";
import { useLocation } from "react-router";
import { ProblemsAttachmentList } from "../math/problems-attachment-list";
import { ocrResultToMarkdown, useOcr } from "~/lib/ocr";
import { blobUrlToBlob } from "~/lib/blob-utils";
import { Spinner } from "../ui/spinner";
import {
  and,
  eq,
  inArray,
  queryOnce,
  useLiveQuery,
  type InitialQueryBuilder,
} from "@tanstack/react-db";
import { useImmer } from "use-immer";
import { z } from "zod";

import { toLabelledComment } from "~/lib/agent/markdown-utils";
import Lightbox, { type SlideImage } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";

import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";
import { type AttachmentTask } from "~/db/db-zod-schema";
import { useBoolean } from "usehooks-ts";
import { X, XIcon } from "lucide-react";
import { bus } from "~/event/event-bus";
import { useSync } from "~/hooks/use-sync";
import BlobUrlPreview from "../common-ui/blob-url-preview";
import { extractFileText } from "~/lib/file";
import IndexedUrlPreview, {
  IndexedUrlImage,
} from "../common-ui/indexed-url-preview";

const OCRInfoSchema = z.object({
  markdown: z.string().describe("ocr markdown"),
});

/** 附件文本抽取任务查询：按附件 id 过滤，updated_at 倒序（最近一次在前） */
const buildAttachmentTasksQuery = (q: InitialQueryBuilder, fileIds: string[]) =>
  q
    .from({ attachmentTasksColl })
    .where(({ attachmentTasksColl }) =>
      and(
        inArray(attachmentTasksColl.attachment_id, fileIds),
        eq(attachmentTasksColl.task_type, "extract_text"),
      ),
    )
    .orderBy(
      ({ attachmentTasksColl }) => attachmentTasksColl.updated_at,
      "desc",
    );

/**
 * 从（已按 updated_at 倒序的）任务列表里，为每个 attachment_id 取最近一次任务。
 */
const toLatestTaskMap = (tasks: AttachmentTask[]) => {
  const seen = new Set<string>();
  const map = new Map<string, AttachmentTask>();
  tasks.forEach((task) => {
    if (seen.has(task.attachment_id)) return;
    seen.add(task.attachment_id);
    map.set(task.attachment_id, task);
  });
  return map;
};

const DisplayAttachments = () => {
  const { files, remove, addItemWithId } = usePromptInputAttachments();
  const { chatId } = useActiveChat();
  const fileIds = useChatPromptInput().use.fileIds();
  const setFileIds = useChatPromptInput().use.setFileIds();
  const [lightBoxIndex, setLightBoxIndex] = useState(0);

  const exFileIds = useMemo(() => files.map((it) => it.id), [files]);

  useSync(exFileIds, setFileIds);

  const {
    value: lightBoxShow,
    setTrue: openLightBox,
    setFalse: closeLightBox,
  } = useBoolean();

  const { data: attachmentsInDb } = useLiveQuery(
    (q) =>
      q
        .from({ attachmentChatRelColl })
        .where(({ attachmentChatRelColl }) =>
          eq(attachmentChatRelColl.chat_id, chatId),
        )
        .join({ attachmentColl }, ({ attachmentColl, attachmentChatRelColl }) =>
          eq(attachmentColl.id, attachmentChatRelColl.attachment_id),
        )
        .orderBy(
          ({ attachmentChatRelColl }) =>
            attachmentChatRelColl.message_created_date,
          "asc",
        )
        .orderBy(
          ({ attachmentChatRelColl }) => attachmentChatRelColl.sort_order,
          "asc",
        )
        .select(({ attachmentColl }) => ({
          ...attachmentColl,
        })),
    [chatId],
  );

  const { slides, slideIdToIndex } = useMemo(() => {
    const withSlide = [
      ...attachmentsInDb
        .filter((it) => it.media_type?.startsWith("image/"))
        .map((it) => ({ id: it.id, slide: { src: it.local_uri } }))
        .filter((it) => !isUndefined(it)),
      ...files
        .filter((it) => it.mediaType.startsWith("image/"))
        .map((it) => ({ id: it.id, slide: { src: it.url } })),
    ];

    return {
      slides: withSlide.map((it) => it.slide) as SlideImage[],
      slideIdToIndex: new Map(withSlide.map((it, index) => [it.id, index])),
    };
  }, [attachmentsInDb, fileIds]);

  useEvent("image:show-light-box", (id) => {
    openLightBox();
    const index = slideIdToIndex.get(id) ?? -1;
    setLightBoxIndex(index);
  });

  const handleRemove = (id: string) => {
    remove(id);
  };

  const urls = files.map((it) => it.url).join(",");

  useEffect(() => {
    const ids = new Set(fileIds);
    files.forEach((f) => {
      if (!ids.has(f.id)) remove(f.id);
    });

    // 补上缺失的附件
    fileIds
      .filter((id) => !files.some((f) => f.id === id))
      .map((id) => attachmentColl.get(id))
      .filter((it) => !isUndefined(it))
      .forEach(({ id, filename, media_type }) => {
        const handler = async () => {
          const bf = await fileStore.getFile(filename!);
          const file = new File([bf], filename ?? id, { type: media_type });
          addItemWithId(file, id);
        };
        handler();
      });
  }, [chatId]);

  const { data: attachmentTasks = [] } = useLiveQuery(
    (q) => {
      if (fileIds.length === 0) return undefined;
      return buildAttachmentTasksQuery(q, fileIds);
    },
    [fileIds],
  );

  // 每个附件最近一次任务（供渲染展示处理结果）
  const latestTaskByAttachment = useMemo(
    () => toLatestTaskMap(attachmentTasks),
    [attachmentTasks],
  );

  useEffect(() => {
    const ids = files.map((it) => it.id);
    if (ids.length === 0) return;

    // 复用同一查询：取每个附件最近一次任务（updated_at 倒序取第一条）
    queryOnce((q) => buildAttachmentTasksQuery(q, ids)).then((tasks) => {
      if (!tasks) return;
      const latest = toLatestTaskMap(tasks);

      // 最近一次任务为 done 的附件，跳过不再处理
      const doneAttachmentIds = new Set(
        files
          .map((it) => latest.get(it.id))
          .filter((task) => task?.status === "done")
          .map((task) => task!.attachment_id),
      );

      const needHandlerFiles = files.filter(
        (it) => !doneAttachmentIds.has(it.id),
      );

      const handlers = needHandlerFiles.map(
        ({ url, id, filename, mediaType }) => {
          const handler = async () => {
            const taskId = genId();
            const now = new Date();

            attachmentTasksColl.insert({
              id: taskId,
              attachment_id: id,
              task_type: "extract_text",
              status: "pending",
              origin_filename: filename,
              created_at: now,
              updated_at: now,
            });

            const blob = await blobUrlToBlob(url);

            await fileStore.save(
              new File([blob], filename ?? genId(), {
                type: blob.type,
              }),
              id,
            );

            attachmentMetaDataColl.insert({
              id,
              origin_filename: filename ?? "",
            });

            try {
              const file_text = await extractFileText(blob, mediaType);
              attachmentTasksColl.update(taskId, (draft) => {
                draft.status = "done";
                draft.result = file_text;
                draft.updated_at = new Date();
              });
            } catch (err) {
              attachmentTasksColl.update(taskId, (draft) => {
                draft.status = "error";
                draft.error = String(err);
                draft.updated_at = new Date();
              });
            }
          };
          return handler;
        },
      );
      Promise.all(handlers.map((h) => h()));
    });
  }, [urls]);

  const toTaskStatus = (fileId: string) => {
    const task = latestTaskByAttachment.get(fileId);
    if (!task) return null;
    const status = task.status;
    if (status === "pending") {
      return <Spinner className="bg-red-50 absolute top-[calc(50%-1rem)]" />;
    }
  };

  return (
    <div className="w-full">
      <AttachmentGroup className="w-full overflow-scroll ">
        {files.map((file) => {
          const { id, url, filename, mediaType } = file;
          return (
            <Attachment
              key={id}
              orientation={"vertical"}
              className="focus-within:ring-0"
            >
              <AttachmentMedia>
                <BlobUrlPreview file={file} />
                {toTaskStatus(id)}
              </AttachmentMedia>

              <AttachmentActions>
                <AttachmentAction
                  aria-label={`Remove ${filename}`}
                  type="button"
                  onClick={() => handleRemove(id)}
                >
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>
              <AttachmentTrigger
                aria-label="Preview research-summary.pdf"

                onClick={() => {
                  bus.emit("image:show-light-box", id);
                }}
              />
            </Attachment>
          );
        })}
      </AttachmentGroup>
      {/* <Lightbox
        open={lightBoxShow}
        plugins={[Counter]}
        close={closeLightBox}
        index={lightBoxIndex}
        slides={slides}
        render={{
          slide({ slide }) {
            if (slide.src.startsWith("blob"))
              return <img src={slide.src} alt=""></img>;
            if (slide.src.startsWith("index"))
              return <IndexedUrlImage src={slide.src} alt="" />;
          },
        }}
        styles={{
          root: {
            "--yarl__color_backdrop": "rgba(0, 0, 0, 0.6)",
          },
        }}
      ></Lightbox> */}
    </div>
  );
};

const DisplaySelectsMap = ({
  selectsMap,
}: {
  selectsMap: Record<string, ToolSelectionItem>;
}) => {
  const clearSelection = useToolSelectionStore.use.clearSelection();
  const { t } = useTranslation();

  if (isEmpty(selectsMap)) {
    return null;
  }

  return (
    <div className="flex w-full flex-wrap gap-1.5">
      {Object.entries(selectsMap).map(([id, item]) => (
        <HoverCard key={id}>
          <HoverCardTrigger asChild>
            <Badge key={id} variant="outline" className="gap-1 pr-1">
              <span className="max-w-40 truncate text-xs">
                {t(`tools.${item.kind}`, item.kind)}: {item.content}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-4"
                onClick={() => clearSelection(id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent>
            <MathRes>{item.content}</MathRes>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
};

const PruePromptInput = () => {
  const { t } = useTranslation();
  const { id, sendMessage, status } = useActiveChatHelpers();
  const { isNewChat, createChat } = useActiveChat();

  const selectsMap = useToolSelectionStore.use.selectsMap();

  const fileIds = useChatPromptInput().use.fileIds();

  const hasAny = useChatPromptInput().use.hasAny();
  const practcieProblems = useChatPromptProblems.use.problems();
  const hasProblems = useChatPromptProblems.use.hasProblems();
  const pushProblem = useChatPromptProblems.use.pushProblem();
  const removeProblem = useChatPromptProblems.use.removeProblem();
  const clearProblems = useChatPromptProblems.use.clearProblems();
  const { state } = useLocation();

  useEffect(() => {
    if (!state) {
      clearProblems();
      return;
    }
    const ns = state as { problemId: string; action: "practice" };
    if (ns.problemId && ns.action === "practice") {
      const problem = problemColl.get(ns.problemId);
      if (!problem) {
        clearProblems();
        return;
      }
      pushProblem(problem);
    }
  }, [state]);

  useEffect(() => {
    if (!isNewChat) {
      clearProblems();
    }
  }, [isNewChat]);

  const onSubmit: PromptInputProps["onSubmit"] = async (message) => {
    if (!hasAny) return;
    const title = message.text;
    if (isNewChat) {
      createChat(title.slice(0, 40));
    }

    const selections = Object.values(selectsMap).filter(
      (it) => it.type === "markdown",
    );
    const selectionPrefix = selections
      .map((it) => {
        const kindLabel = t(`tools.${it.kind}`, it.kind);
        const quotedContent = it.content.replaceAll("\n", "\n> ");
        return t("chat.quoteFrom", {
          kind: kindLabel,
          content: quotedContent,
        });
      })
      .join("\n\n");

    const fullText = selectionPrefix
      ? `${selectionPrefix}\n\n${message.text}`
      : message.text;

    const parts: any[] = [];
    parts.push({ text: fullText, type: "text" });

    const practiceComments = toLabelledComment(
      "practice-problem",
      practcieProblems,
    );
    const attachments = await queryOnce((q) => {
      return buildAttachmentTasksQuery(q, fileIds);
    });
    const attachmentText = toLabelledComment(
      "attachment-ocr-result",
      [...toLatestTaskMap(attachments).values()].map((it) => it.result),
    );
    const messageId = genId();
    const endMessage = {
      files: [],
      text: [practiceComments, fullText, attachmentText].join("\n"),
      metadata: {
        practiceProblems: practcieProblems,
        attachmentIds: fileIds,
        message_id: messageId,
      },
    };

    const now = new Date();

    chatMessageColl.insert({
      chat_id: id,
      role: "user",
      id: messageId,
      parts,
      metadata: {
        created_at: now,
        practiceProblems: practcieProblems,
        attachmentIds: fileIds,
        message_id: messageId,
      },
      created_at: now,
    });

    fileIds.forEach((it, idx) => {
      attachmentChatRelColl.insert({
        chat_id: id,
        id: genId(),
        attachment_id: it,
        sort_order: idx,
        message_id: messageId,
        message_created_date: now,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    sendMessage(endMessage);
    setTextInputValue("");
  };

  const { textInput } = usePromptInputController();
  const textInputValue = useChatPromptInput().use.textInputValue();
  const setTextInputValue = useChatPromptInput().use.setTextInputValue();
  const setSuggestions = useChatPromptSuggestionStore.use.setSuggestions();

  useSync(textInput.value, setTextInputValue);

  useEffect(() => {
    if (isNewChat) {
      setSuggestions([]);
    }
  }, [isNewChat, setSuggestions]);

  useEvent("push-prompt-input", (prompt) => {
    textInput.setInput(prompt);
  });
  // 切换聊天时：从 Zustand 恢复草稿到 PromptInput（一次性，单向）
  useEffect(() => {
    textInput.setInput(textInputValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <PromptInput
      globalDrop
      multiple
      onSubmit={onSubmit}
      accept="image/*,text/plain"
      className="bg-background"
    >
      <PromptInputHeader>
        {hasProblems && (
          <ProblemsAttachmentList
            problems={practcieProblems}
            handleRemove={removeProblem}
          />
        )}
        <DisplayAttachments />
        {/* <DisplaySelectsMap selectsMap={selectsMap} /> */}
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => {
            textInput.setInput(e.target.value);
            setSuggestions([]);
          }}
          className="min-w-0 scrollbar-thin"
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>
        <div className="flex items-center gap-2">
          <ChatPromptModelThinkingEffort />
          <ChatPromptModelSelector />
          <PromptInputSubmit status={status} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
};
const ChatPromptInput = () => {
  return (
    <PromptInputProvider>
      <PruePromptInput />
    </PromptInputProvider>
  );
};

export default ChatPromptInput;
