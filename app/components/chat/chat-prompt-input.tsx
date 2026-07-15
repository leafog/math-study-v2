import { useNavigate } from "react-router";
import { useActiveChat, useActiveChatHelpers } from "~/hooks/chat/active-chat";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputProps,
} from "~/components/ai-elements/prompt-input";

import { conversationsColl, messagesColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import type { TextPart } from "ai";

const ChatPromptInput = () => {
  const { id, sendMessage, status } = useActiveChatHelpers();
  const { isNewChat } = useActiveChat();
  const navigate = useNavigate();

  const onSubmit: PromptInputProps["onSubmit"] = (message) => {
    //
    const title = message.text;
    if (isNewChat) {
      conversationsColl.insert({
        id,
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      navigate(`/chat/${id}`);
    }

    sendMessage(message);
    const textPart: TextPart = {
      text: message.text,
      type: "text",
    };
    const parts: any[] = [];
    parts.push(textPart);
    if (message.files.length > 0) {
      parts.push(message.files);
    }
    messagesColl.insert({
      conversationId: id,
      role: "user",
      id: genId(),
      parts,
      createdAt: new Date(),
    });
  };
  return (
    <PromptInputProvider>
      <PromptInput globalDrop multiple onSubmit={onSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => {}}
            className="scrollbar-thin"
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </PromptInputProvider>
  );
};

export default ChatPromptInput;
