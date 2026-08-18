import { useTranslation } from "react-i18next";
import {
  useActiveChat,
  useActiveChatHelpers,
  useChatModel,
} from "~/hooks/chat/active-chat";
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
} from "~/components/ai-elements/prompt-input";

import {
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
  AttachmentTitle,
  AttachmentTrigger,
} from "../ui/attachment";
import { Plus, X, XIcon } from "lucide-react";
import { fileStore, attachmentQueue } from "~/db/indexdb-file-storage";
import { type FileUIPart } from "ai";
import {
  useToolSelectionStore,
  type ToolSelectionItem,
} from "./tools/store/tool-selection";
import { isEmpty } from "lodash-es";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../ui/hover-card";
import MathRes from "../math/math-res";
import { useEffect, useMemo, useRef } from "react";
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
import { inArray, queryOnce } from "@tanstack/react-db";
import { useImmer } from "use-immer";
import { z } from "zod";
import type { OcrResult } from "@paddleocr/paddleocr-js";
import { useGenerateObject } from "~/hooks/chat/active-chat/use-generate-object";
import { getPrompt } from "~/lib/agent/instructions";
import AttachmentDialog from "./attachment-dialog";
import { DialogContent, DialogTitle } from "../ui/dialog";
import MathResBlock from "../math/math-res-block";

const OCRInfoSchema = z.object({
  markdown: z.string().describe("ocr markdown"),
});
const DisplayAttachments = () => {
  const { files, remove } = usePromptInputAttachments();
  const model = useChatModel();
  const { generate: generateOCRInfo } = useGenerateObject(OCRInfoSchema);

  const handleRemove = (id: string) => {
    remove(id);
  };
  const urls = files.map((it) => it.url).join(",");
  const ocr = useOcr();

  const [handlering, setHandlering] = useImmer(new Set());
  const [handlerResult, setHandlerResult] = useImmer(new Map<string, string>());

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
          draft.set(id, meta_data ?? "");
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
      const handlers = needHandlerFiles.map(({ url, id, filename }) => {
        const handler = async () => {
          const blob = await blobUrlToBlob(url);
          const res = await ocr.predict(blob);
          const items = res[0].items
            .filter((it) => it.text?.trim())
            .map((it) => ({
              text: it.text,
              score: Math.round(it.score * 100),
              top: Math.round(Math.min(...it.poly.map(([, y]) => y))), // 最小 y
              left: Math.round(Math.min(...it.poly.map(([x]) => x))), // 最小 x
            }));

          const prompt = getPrompt("ocr.toMarkdown", {
            vars: { ocr: JSON.stringify(items) },
          });
          console.log(res);
          const gen = await generateOCRInfo(prompt);

          const resultText = gen?.markdown?.trim() || JSON.stringify(res);

          await fileStore.save(
            new File([blob], filename ?? genId(), {
              type: blob.type,
            }),
            id,
            resultText,
          );
          setHandlering((draft) => {
            draft.delete(id);
            return draft;
          });
          setHandlerResult((draft) => {
            draft.set(id, resultText);
            return draft;
          });
        };
        return handler;
      });
      Promise.all(handlers.map((h) => h()));
    });
  }, [urls, ocr]);

  if (files.length === 0) {
    return null;
  }
  return (
    <div className="w-full">
      <AttachmentGroup className="w-full overflow-scroll ">
        {files.map(({ id, url, filename, mediaType }) => {
          return (
            <Attachment
              key={id}
              orientation={"vertical"}
              className="focus-within:ring-0"
            >
              <AttachmentMedia>
                <img src={url} alt={filename}></img>
                {handlering.has(id) && (
                  <Spinner className="z-40 bg-red-50 absolute top-1/2" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{filename}</AttachmentTitle>
                <AttachmentDescription>{mediaType}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  aria-label={`Remove ${filename}`}
                  type="button"
                  onClick={() => handleRemove(id)}
                >
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>

              <AttachmentDialog>
                <DialogContent>
                  <DialogTitle>{filename}</DialogTitle>
                  <img src={url}></img>
                  <div>
                    <MathResBlock>{handlerResult.get(id)}</MathResBlock>
                  </div>
                </DialogContent>
              </AttachmentDialog>
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
  const { t, i18n } = useTranslation();
  const { id, sendMessage, status } = useActiveChatHelpers();
  const { isNewChat, createChat } = useActiveChat();
  const model = useChatModel();
  const selectsMap = useToolSelectionStore.use.selectsMap();

  const practcieProblems = useChatPromptProblems.use.problems();
  const hasProblems = useChatPromptProblems.use.hasProblems();
  const pushProblem = useChatPromptProblems.use.pushProblem();
  const removeProblem = useChatPromptProblems.use.removeProblem();
  const clearProblems = useChatPromptProblems.use.clearProblems();
  const { state } = useLocation();

  const ocr = useOcr();

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

    // if (fileParts.length > 0) {
    //   parts.push(...fileParts);
    // }

    // 练习题目作为隐藏的 HTML 注释发给模型：模型能看到，界面不渲染。
    const practiceComments = practcieProblems
      .map(
        (p, i) =>
          `<!-- practice-problem ${i + 1}\nid: ${p.id}\ndescription: ${p.description ?? ""}\ncontent:\n${p.content.replaceAll("--", "- -")}\n-->`,
      )
      .join("\n\n");

    setTextInputValue("");
    const endMessage = {
      ...message,
      text: practiceComments ? `${fullText}\n\n${practiceComments}` : fullText,
      metadata: {
        practiceProblems: practcieProblems,
      },
    };
    const now = new Date();
    chatMessageColl.insert({
      chat_id: id,
      role: "user",
      id: genId(),
      parts,
      metadata: {
        created_at: now,
        practiceProblems: practcieProblems,
      },
      created_at: now,
    });

    sendMessage(endMessage);
  };
  const { textInput } = usePromptInputController();
  const textInputValue = useChatPromptInput().use.textInputValue();
  const setTextInputValue = useChatPromptInput().use.setTextInputValue();
  const setSuggestions = useChatPromptSuggestionStore.use.setSuggestions();

  useEffect(() => {
    if (isNewChat) {
      setSuggestions([]);
    }
  }, [isNewChat, setSuggestions]);

  useEvent("push-prompt-input", (prompt) => {
    textInput.setInput(prompt);
    setTextInputValue(prompt);
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
            setTextInputValue(e.currentTarget.value);
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
