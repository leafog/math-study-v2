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
import { Plus, XIcon } from "lucide-react";
import { fileStore } from "~/db/indexdb-file-storage";
import type { FileUIPart } from "ai";
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

const ChatPromptInput = () => {
  const { id, sendMessage, status } = useActiveChatHelpers();
  const { isNewChat, createChat } = useActiveChat();
  const navigate = useNavigate();

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

    const parts: any[] = [];
    parts.push({ text: message.text, type: "text" });
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
    console.log(message.files);
    // sendMessage(message);
    sendMessage(message);
  };

  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <PromptInputHeader>
          <DisplayAttachments />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => {}}
            className="scrollbar-thin"
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
