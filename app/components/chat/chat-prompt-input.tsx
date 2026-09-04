import { useTranslation } from "react-i18next";
import {
  useActiveChat,
  useActiveChatHelpers,
  useChatTools,
} from "~/hooks/chat/active-chat";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
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

import { md5 } from "hash-wasm";

import {
  attachmentChatRelColl,
  attachmentColl,
  attachmentHashColl,
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
import { groupBy, isEmpty, isUndefined, keyBy, values } from "lodash-es";
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
import { useRxEvent } from "~/event/events";

import ChatPromptModelSelector from "./chat-prompt-model-selector";
import ChatPromptModelThinkingEffort from "./chat-prompt-model-thinking-effort";
import { useLocation } from "react-router";
import { ProblemsAttachmentList } from "../math/problems-attachment-list";

import { blobUrlToBlob } from "~/lib/blob-utils";
import { composeImagesToBlob } from "~/lib/img-utils";
import { llmPredictObject } from "~/lib/agent/version-agent";
import { z } from "zod";
import { Spinner } from "../ui/spinner";
import {
  and,
  eq,
  inArray,
  queryOnce,
  useLiveQuery,
  type InitialQueryBuilder,
} from "@tanstack/react-db";
import { toLabelledComment } from "~/lib/agent/markdown-utils";
import { getPrompt } from "~/lib/agent/instructions";

import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";
import { type AttachmentTask } from "~/db/db-zod-schema";
import { useBoolean } from "usehooks-ts";
import { X, XIcon } from "lucide-react";
import { bus } from "~/event/events";
import { useSync } from "~/hooks/use-sync";
import BlobUrlPreview from "../common-ui/blob-url-preview";
import { extractFileText } from "~/lib/file";

import { useImmer } from "use-immer";
import AnnoHoverCard from "./tools/anno-hover-card";
import type { Annotation } from "~/store/chat-prompt-input-store";
import { llmPredict } from "~/lib/agent/version-agent";

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

// ---------- 发送前把「练习 / 附件」构建成发往模型的 prompt 文本（统一返回 Promise<string>） ----------

/** 统一构建器类型：入参 T，异步返回组装后的文本 */
type BuildCommentFC<T> = (arg: T) => Promise<string>;

/** 练习题目注释块：按 pids 查题后拼成注释 */
const buildPracticeComments: BuildCommentFC<string[]> = async (pids) => {
  if (pids.length === 0) return "";
  const problems = await queryOnce((q) =>
    q
      .from({ problem: problemColl })
      .where(({ problem }) => inArray(problem.id, pids)),
  );
  return toLabelledComment(
    "practice-problem",
    getPrompt("chat.practicePrompt"),
    problems,
  );
};

/** 附件 OCR 结果注释块：按 fileIds 查元数据与题目后拼成注释 */
const buildAttachmentComments: BuildCommentFC<string[]> = async (fileIds) => {
  if (fileIds.length === 0) return "";
  const attMetas = await queryOnce((q) =>
    q
      .from({ attMeta: attachmentMetaDataColl })
      .where(({ attMeta }) => inArray(attMeta.id, fileIds)),
  );
  const attProblems = await queryOnce((q) =>
    q.from({ problem: problemColl }).where(({ problem }) =>
      inArray(
        problem.source_attachment_id,
        attMetas.map((it) => it.id),
      ),
    ),
  );
  const attProblemsMap = groupBy(attProblems, (it) => it.source_attachment_id);
  return toLabelledComment(
    "attachment-ocr-result",
    getPrompt("chat.attachmentPrompt"),
    attMetas.map((it) => ({
      id: it.id,
      text: it.last_task_text,
      problems: attProblemsMap[it.id] ?? [],
    })),
  );
};

/** 标注识别结果 schema：每个标注一个 { id, content } */
const annotationRecognitionSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
    }),
  ),
});

const buildAnnotationComments: BuildCommentFC<
  Record<string, Annotation[]>
> = async (annotationsByTool) => {
  const cells = Object.values(annotationsByTool)
    .flat()
    .map((anno, i) =>
      anno.type === "image"
        ? {
            source: { kind: "image" as const, data: anno.imageUrl ?? "" },
            label: String(i + 1),
          }
        : {
            source: { kind: "svg" as const, data: anno.svgXmlStr ?? "" },
            bounds: anno.bounds,
            label: String(i + 1),
          },
    );

  if (cells.length === 0) return "";

  // 所有标注拼成一张合成图，交给视觉模型按编号识别
  const blob = await composeImagesToBlob(cells);
  const result = await llmPredictObject(blob, {
    schema: annotationRecognitionSchema,
    prompt: getPrompt("chat.annotationPrompt"),
  });

  if (!result || result.items.length === 0) return "";

  // 按编号顺序对齐到标注，供下游模型理解每个标注圈的是什么
  const items = result.items
    .map((it) => ({
      id: it.id,
      content: it.content,
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));

  return toLabelledComment("annotation-recognition", "", items);
};

const DisplayAttachments = () => {
  const { files, remove, addItemWithId } = usePromptInputAttachments();
  const { chatId, isNewChat } = useActiveChat();
  const fileIds = useChatPromptInput().use.fileIds();
  const setFileIds = useChatPromptInput().use.setFileIds();
  const [lightBoxIndex, setLightBoxIndex] = useState(0);

  const [fileIdMap, setFileIdMap] = useImmer(new Map<string, string>());

  const exFileIds = useMemo(
    () => files.map((it) => fileIdMap.get(it.id) ?? it.id),
    [files, fileIdMap],
  );

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

  const handleRemove = (id: string) => {
    remove(id);
  };

  const urls = files.map((it) => it.url).join(",");
  const syncInputFiles = (ids: Set<string>) => {
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
  };

  const { state } = useLocation();

  useEffect(() => {
    if (state?.fileIds) {
      const nfids = state.fileIds as Set<string>;
      if (isNewChat) {
        syncInputFiles(nfids);
      }
    }
  }, [state]);

  useEffect(() => {
    const ids = new Set(fileIds);
    syncInputFiles(ids);
  }, [chatId]);

  const { data: attachmentTasks = [] } = useLiveQuery(
    (q) => {
      if (fileIds.length === 0) return undefined;
      return buildAttachmentTasksQuery(q, [...fileIdMap.values()]);
    },
    [fileIdMap],
  );

  // 每个附件最近一次任务（供渲染展示处理结果）
  const latestTaskByAttachment = useMemo(
    () => toLatestTaskMap(attachmentTasks),
    [attachmentTasks],
  );

  useEffect(() => {
    const ids = files.map((it) => it.id);
    if (ids.length === 0) return;

    setFileIdMap((draft) => {
      ids.forEach((it) => draft.set(it, it));
    });

    queryOnce((q) =>
      q
        .from({ attMeta: attachmentMetaDataColl })
        .where(({ attMeta }) => inArray(attMeta.id, ids)),
    ).then((metas) => {
      const metasMap = keyBy(metas, (it) => it.id);
      const doneAttachmentIds = new Set(
        files
          .map((it) => metasMap[it.id])
          .filter((it) => it?.last_task_text)
          .map((it) => it.id),
      );
      const needHandlerFiles = files.filter(
        (it) => !doneAttachmentIds.has(it.id),
      );
      const handlers = needHandlerFiles.map(
        ({ url, id, filename, mediaType }) => {
          const handler = async () => {
            const taskId = genId();
            const now = new Date();
            const blob = await blobUrlToBlob(url);
            const blobBytes = await blob.bytes();

            const md5Result = await md5(blobBytes);
            const attachmentHash = attachmentHashColl.get(md5Result);
            if (attachmentHash?.attachment_id) {
              setFileIdMap((draft) => {
                draft.set(id, attachmentHash?.attachment_id);
              });
            } else {
              attachmentTasksColl.insert({
                id: taskId,
                attachment_id: id,
                task_type: "extract_text",
                status: "pending",
                origin_filename: filename,
                created_at: now,
                updated_at: now,
              });
              attachmentHashColl.insert({
                id: md5Result,
                attachment_id: id,
                created_at: now,
              });
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
                attachmentMetaDataColl.update(id, (draft) => {
                  draft.last_task_text = file_text;
                });
              } catch (err) {
                attachmentTasksColl.update(taskId, (draft) => {
                  draft.status = "error";
                  draft.error = String(err);
                  draft.updated_at = new Date();
                });
              }
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
      return <Spinner className="absolute top-[calc(50%-1rem)]" />;
    }
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <AttachmentGroup className="w-full overflow-scroll ">
        {files.map((file) => {
          const { id, url, filename, mediaType } = file;
          const realFileId = fileIdMap.get(id) ?? id;
          return (
            <Attachment
              key={id}
              orientation={"vertical"}
              className="focus-within:ring-0"
            >
              <AttachmentMedia>
                <BlobUrlPreview file={file} />
                {toTaskStatus(realFileId)}
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
                  bus.emit("open:tool:by-ref-id", {
                    kind: "showAttachment",
                    title: filename ?? "",
                    refId: realFileId,
                  });
                }}
              />
            </Attachment>
          );
        })}
      </AttachmentGroup>
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

  const fileIds = useChatPromptInput().use.fileIds();

  const hasAny = useChatPromptInput().use.hasAny();
  const problemIds = useChatPromptInput().use.problemIds();
  const hasProblems = useChatPromptInput().use.hasProblems();
  const addProblemIds = useChatPromptInput().use.addProblemIds();
  const clearProblemIds = useChatPromptInput().use.clearProblemIds();
  const removeProblemId = useChatPromptInput().use.removeProblemId();

  const { textInput } = usePromptInputController();
  const textInputValue = useChatPromptInput().use.textInputValue();
  const setTextInputValue = useChatPromptInput().use.setTextInputValue();
  // 按工具分组的标注，hover card 每个工具一个 Tab
  const annotationsByTool = useChatPromptInput().use.annotationsByTool();
  const removeAnnotation = useChatPromptInput().use.removeAnnotation();

  const setSuggestions = useChatPromptSuggestionStore.use.setSuggestions();

  const { chatToolInstancesMap } = useChatTools();

  useSync(textInput.value, setTextInputValue);

  // 只持久化 id，完整题目在渲染/发送时按 id 从库中查询
  const { data: practiceProblems = [] } = useLiveQuery(
    (q) => {
      if (problemIds.length === 0) return undefined;
      return q
        .from({ problemColl })
        .where(({ problemColl }) => inArray(problemColl.id, problemIds));
    },
    [problemIds],
  );

  const { state } = useLocation();

  // 从题库「开始聊天」带过来的题目 id，落到草稿
  useEffect(() => {
    if (!state) return;
    const ns = state as { problemIds?: string[] };
    if (Array.isArray(ns.problemIds) && ns.problemIds.length > 0) {
      addProblemIds(ns.problemIds);
    }
  }, [state]);

  const onSubmit: PromptInputProps["onSubmit"] = async (message) => {
    if (!hasAny) return;
    const title = message.text;
    if (isNewChat) {
      createChat(title.slice(0, 40));
    }

    const [practiceComments, attachmentText, annotationComments] =
      await Promise.all([
        buildPracticeComments(problemIds),
        buildAttachmentComments(fileIds),
        buildAnnotationComments(annotationsByTool),
      ]);
    const messageId = genId();

    const now = new Date();
    const metadata = {
      created_at: now,
      practiceProblemIds: problemIds,
      attachmentIds: fileIds,
      message_id: messageId,
    };

    const endMessage = {
      files: [],
      text: [
        practiceComments,
        attachmentText,
        annotationComments,
        message.text,
      ].join("\n"),
      metadata,
    };

    // 入库的 parts 与发到模型的 endMessage.text 保持一致（含 <!-- --> 注释），
    // 否则跨轮历史从 parts 重建时练习/附件内容会丢
    chatMessageColl.insert({
      chat_id: id,
      role: "user",
      id: messageId,
      parts: [{ text: endMessage.text, type: "text" }],
      metadata,
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

    clearProblemIds();
    setTextInputValue("");
  };

  useEffect(() => {
    if (isNewChat) {
      setSuggestions([]);
    }
  }, [isNewChat, setSuggestions]);

  useRxEvent("push-prompt-input", true, (prompt) => {
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
        {!isEmpty(annotationsByTool) && (
          <AnnoHoverCard
            annotationsByTool={annotationsByTool ?? {}}
            toolsMap={chatToolInstancesMap}
            onRemove={removeAnnotation}
          />
        )}

        {hasProblems && (
          <ProblemsAttachmentList
            problems={practiceProblems}
            handleRemove={removeProblemId}
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
            <PromptInputActionMenuContent className="min-w-40">
              <PromptInputActionAddAttachments
                label={t("attachment.addLabel")}
              />
              <PromptInputActionMenuItem>hehe</PromptInputActionMenuItem>
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
