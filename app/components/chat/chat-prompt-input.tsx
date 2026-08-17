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
} from "~/components/ai-elements/prompt-input";

import { chatMessageColl, problemColl } from "~/db/tdb-collections";
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
} from "../ui/attachment";
import { Plus, X, XIcon } from "lucide-react";
import { fileStore } from "~/db/indexdb-file-storage";
import { convertToModelMessages, type FileUIPart } from "ai";
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
import { useEffect } from "react";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { useChatPromptProblems } from "~/store/chat-prompt-problems";
import { useEvent } from "~/event/use-event";

import ChatPromptModelSelector from "./chat-prompt-model-selector";
import ChatPromptModelThinkingEffort from "./chat-prompt-model-thinking-effort";
import { useLocation } from "react-router";
import { ProblemsAttachmentList } from "../math/problems-attachment-list";

const DisplayAttachments = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  const handleRemove = (id: string) => {
    attachments.remove(id);
  };
  return (
    <div>
      <AttachmentGroup>
        {attachments.files.map(({ id, url, filename, mediaType }) => {
          return (
            <Attachment key={id}>
              <AttachmentMedia>
                <Plus />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{filename}</AttachmentTitle>
                <AttachmentDescription>{mediaType}</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  aria-label={`Remove ${filename}`}
                  onClick={() => handleRemove(id)}
                >
                  <XIcon />
                </AttachmentAction>
              </AttachmentActions>
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
  const selectsMap = useToolSelectionStore.use.selectsMap();

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
    const title = message.text;
    if (isNewChat) {
      createChat(title.slice(0, 40));
    }
    const fileParts = await Promise.all(
      message.files.map(async (file: FileUIPart) => {
        const response = await fetch(file.url);
        const blob = await response.blob();
        const { meta, url } = await fileStore.save(
          new File([blob], file.filename ?? "file", { type: file.mediaType }),
        );
        return { ...file, url } as FileUIPart;
      }),
    );

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

    if (fileParts.length > 0) {
      parts.push(...fileParts);
    }

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
        <DisplaySelectsMap selectsMap={selectsMap} />
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
