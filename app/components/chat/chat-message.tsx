import { useEffect } from "react";
import { MessageResponse } from "../ai-elements/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import { Message, MessageContent } from "../ui/message";
import type { UIMessage } from "ai";
import { useActiveChatState } from "~/hooks/use-active-chat";

const ChatMessage = ({ message }: { message: UIMessage }) => {
  return (
    <div>
      <Message align={message.role === "user" ? "end" : "start"}>
        <MessageContent className="w-full">
          <Bubble variant={"outline"} className=" max-w-full">
            <BubbleContent className="w-full">
              {message.parts.length === 1 &&
                message.parts[0].type === "step-start" && <div>reading</div>}
              {message.parts
                .filter((it) => it.type === "text")
                .map((it, i) => (
                  <MessageResponse className="w-full" key={i}>
                    {it.text}
                  </MessageResponse>
                ))}
              <MessageResponse></MessageResponse>
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </div>
  );
};

export default ChatMessage;
