import { useNavigate } from "react-router";
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
  type PromptInputProps,
} from "~/components/ai-elements/prompt-input";

import { chatMessageColl } from "~/db/tdb-collections";
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
import type { FileUIPart } from "ai";
import {
  useToolSelectionStore,
  type ToolSelectionItem,
} from "./tools/store/tool-selection";
import { filter, isEmpty } from "lodash-es";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { MessageResponse } from "../ai-elements/message";
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

const kindLabels: Record<string, string> = {
  blocknote: "笔记",
};

const DisplaySelectsMap = ({
  selectsMap,
}: {
  selectsMap: Record<string, ToolSelectionItem>;
}) => {
  const clearSelection = useToolSelectionStore.use.clearSelection();

  if (isEmpty(selectsMap)) {
    return null;
  }

  return (
    <div className="flex w-full flex-wrap gap-1.5">
      {Object.entries(selectsMap).map(([id, item]) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Badge key={id} variant="outline" className="gap-1 pr-1">
              <span className="max-w-40 truncate text-xs">
                {kindLabels[item.kind] ?? item.kind}: {item.content}
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
          </TooltipTrigger>
          <TooltipContent>
            <MessageResponse>{item.content}</MessageResponse>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

const ChatPromptInput = () => {
  const { id, sendMessage, status } = useActiveChatHelpers();
  const { isNewChat, createChat } = useActiveChat();
  const selectsMap = useToolSelectionStore.use.selectsMap();

  const onSubmit: PromptInputProps["onSubmit"] = async (message) => {
    const title = message.text;
    if (isNewChat) {
      createChat(title);
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

    // 把工具选区拼到消息文本前面
    const selections = Object.values(selectsMap).filter(
      (it) => it.type === "markdown",
    );
    const selectionPrefix = selections
      .map(
        (it) =>
          `> 来自 ${it.kind} 的引用:\n>\n> ${it.content.replace(/\n/g, "\n> ")}`,
      )
      .join("\n\n");

    const fullText = selectionPrefix
      ? `${selectionPrefix}\n\n${message.text}`
      : message.text;

    const parts: any[] = [];
    parts.push({ text: fullText, type: "text" });
    if (fileParts.length > 0) {
      parts.push(...fileParts);
    }

    chatMessageColl.insert({
      conversation_id: id,
      role: "user",
      id: genId(),
      parts,
      created_at: new Date(),
    });
    sendMessage({ ...message, text: fullText });
  };

  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <PromptInputHeader>
          <DisplayAttachments />
          <DisplaySelectsMap selectsMap={selectsMap} />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => {}}
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
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
};

export default ChatPromptInput;
