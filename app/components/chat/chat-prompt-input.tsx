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
  chatMessageColl,
  conversationColl,
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
import { isEmpty, isUndefined, values } from "lodash-es";
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
import { eq, inArray, queryOnce, useLiveQuery } from "@tanstack/react-db";
import { useImmer } from "use-immer";
import { z } from "zod";

import { toLabelledComment } from "~/lib/agent/markdown-utils";
import Lightbox, { type SlideImage } from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";

import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/styles.css";
import {
  AttachmentMetaDataSchema,
  type AttachmentMetaData,
} from "~/db/db-zod-schema";
import { useBoolean } from "usehooks-ts";
import { X, XIcon } from "lucide-react";
import { bus } from "~/event/event-bus";
import useVersion from "~/lib/agent/version-agent";
import { useSync } from "~/hooks/use-sync";
import IndexedUrlPreview from "../common-ui/indexed-url-preview";
import BlobUrlPreview from "../common-ui/blob-url-preview";

const OCRInfoSchema = z.object({
  markdown: z.string().describe("ocr markdown"),
});

const DisplayAttachments = () => {
  const { files, remove, addItemWithId } = usePromptInputAttachments();
  const { chatId } = useActiveChat();
  const fileIds = useChatPromptInput().use.fileIds();
  const setFileIds = useChatPromptInput().use.setFileIds();
  const [lightBoxIndex, setLightBoxIndex] = useState(0);

  const [slidesInDbMap, setSlidesInDbMap] = useImmer(
    new Map<string, SlideImage>(),
  );
  useEffect(() => {
    console.log(files);
  }, [files]);

  const exFileIds = useMemo(() => files.map((it) => it.id), [files]);

  useSync(exFileIds, setFileIds);
  console.log(fileIds);

  const slidesInInputMap = useMemo(() => {
    return new Map(
      files.map<[string, SlideImage]>(({ id, url }) => [id, { src: url }]),
    );
  }, [files]);

  const mergedMap = useMemo(() => {
    return new Map([...slidesInDbMap, ...slidesInInputMap]);
  }, [slidesInDbMap, slidesInInputMap]);

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
  const slides = useMemo(() => {
    const sort_ids = [
      ...attachmentsInDb.map((it) => it.id).filter((it) => !isUndefined(it)),
      ...fileIds,
    ];
    return sort_ids
      .map((it) => mergedMap.get(it))
      .filter((it) => !isUndefined(it));
  }, [attachmentsInDb, fileIds]);
  const sort_ids = [
    ...attachmentsInDb.map((it) => it.id).filter((it) => !isUndefined(it)),
    ...fileIds,
  ];

  useEffect(() => {
    setSlidesInDbMap((draft) => {
      draft.clear();
    });
    const handlers = attachmentsInDb
      .filter((it) => it.local_uri !== undefined)
      .map(({ id, local_uri }) => {
        const handler = async () => {
          console.log(local_uri);
          const url = await fileStore.getUrl(local_uri!);
          setSlidesInDbMap((draft) => {
            draft.set(id!, { src: url });
          });
        };
        return handler;
      });
    Promise.all(handlers.map((h) => h()));
  }, [attachmentsInDb]);

  const handleRemove = (id: string) => {
    remove(id);
  };

  const urls = files.map((it) => it.url).join(",");
  const ocr = useOcr();
  const { predict } = useVersion();

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

  const [handlering, setHandlering] = useImmer(new Set());
  const [handlerResult, setHandlerResult] = useImmer(
    new Map<string, AttachmentMetaData>(),
  );
  useEvent("image:show-light-box", (id) => {
    openLightBox();
    const index = [...mergedMap.keys()].indexOf(id);
    console.log(id, [...mergedMap.keys()].indexOf(id));
    setLightBoxIndex(index);
  });

  useEffect(() => {
    if (ocr === null) return;
    setHandlering((draft) => {
      draft.clear();
      return draft;
    });
    setHandlerResult((draft) => {
      draft.clear();
      return draft;
    });
    const ids = files.map((it) => it.id);

    queryOnce((q) =>
      q
        .from({ attachmentColl })
        .where(({ attachmentColl }) => inArray(attachmentColl.id, ids)),
    ).then((it) => {
      setHandlerResult((draft) => {
        it.forEach(({ id, meta_data }) => {
          const result = AttachmentMetaDataSchema.safeParse(
            JSON.parse(meta_data ?? "{}"),
          );
          draft.set(
            id,
            result.success
              ? result.data
              : {
                  filename: "",
                  ocr_result: "",
                },
          );
        });
        return draft;
      });

      const indbIdsSet = new Set(it.map((it) => it.id));
      const needHandlerFiles = files.filter((it) => !indbIdsSet.has(it.id));

      setHandlering((draft) => {
        draft.clear();
        needHandlerFiles.forEach((it) => draft.add(it.id));
        return draft;
      });
      const handlers = needHandlerFiles.map(
        ({ url, id, filename, mediaType }) => {
          const handler = async () => {
            console.log(mediaType);
            // @TODO 根据 media_type 去做不同的处理方法 😅
            const blob = await blobUrlToBlob(url);

            const fileEntry = await fileStore.save(
              new File([blob], filename ?? genId(), {
                type: blob.type,
              }),
              id,
            );

            const res = await predict(blob);
            console.log(res);
            // const resultText = ocrResultToMarkdown(res);
            const resultText = res;
            const meta_data: AttachmentMetaData = {
              filename: filename ?? "",
              ocr_result: resultText,
            };

            attachmentColl.update(id, (draft) => {
              draft.meta_data = JSON.stringify(meta_data);
            });

            setHandlering((draft) => {
              draft.delete(id);
              return draft;
            });
            setHandlerResult((draft) => {
              draft.set(id, meta_data);
              return draft;
            });
          };
          return handler;
        },
      );
      Promise.all(handlers.map((h) => h()));
    });
  }, [urls, ocr]);

  return (
    <div className="w-full">
      {fileIds.map((it) => it).join("---")}
      {JSON.stringify([...slidesInDbMap.values()])}
      "00000"
      {JSON.stringify([...slidesInInputMap.values()])}
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
                {handlering.has(id) && (
                  <Spinner className="z-40 bg-red-50 absolute top-1/2" />
                )}
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
      <Lightbox
        open={lightBoxShow}
        plugins={[Counter]}
        close={closeLightBox}
        index={lightBoxIndex}
        slides={slides}
        styles={{
          root: {
            "--yarl__color_backdrop": "rgba(0, 0, 0, 0.6)",
          },
        }}
      ></Lightbox>
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

  const clearFileIds = useChatPromptInput().use.clearFileIds();

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
      return q
        .from({ attachmentColl })
        .where(({ attachmentColl }) => inArray(attachmentColl.id, fileIds));
    });
    const ocrResult = attachments.map((it) => it.meta_data);

    const attachmentText = toLabelledComment(
      "attachment-ocr-result",
      ocrResult,
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
