import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { Message, MessageContent } from "../ui/message";
import { Bubble, BubbleContent } from "../ui/bubble";
import { useBoolean } from "usehooks-ts";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../../../components/ai-elements/prompt-input";
import ChatHeaderContainer from "./chat-header-container";

import ToolsToggleBtn from "./tools-toggle-btn";
import ChatMenuBtn from "./chat-menu-btn";
import { useChatMenuBtnStore } from "~/store/chat-menu-store";
import { useEffect, type PropsWithChildren } from "react";
import { Card, CardHeader } from "../ui/card";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}

const LRWrapper = ({ children }: PropsWithChildren) => {
  return <div className="flex flex-row size-full ">{children}</div>;
};
const LWrapper = ({ children }: PropsWithChildren) => {
  return <div className="flex-1">{children}</div>;
};

const RWrapper = ({ children }: PropsWithChildren) => {
  return <div className="sticky top-0 self-start">{children}</div>;
};

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const onChatResize = useChatToolsPanelStore.use.onChatResize();
  const toolsShow = useChatToolsPanelStore.use.toolsShow();
  const menuShow = useChatMenuBtnStore.use.value();
  const menuOff = useChatMenuBtnStore.use.off();

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResize(size)}
      className="flex flex-col"
    >
      <ChatHeaderContainer className=" border-b-2">
        <span className="h-14"></span>
        <div className="gap-2 flex">
          <ChatMenuBtn />
          {!toolsShow && <ToolsToggleBtn />}
        </div>
      </ChatHeaderContainer>
      <div className="flex flex-row relative w-full flex-1 overflow-hidden">
        <MessageScrollerProvider>
          <div className="w-full">
            <div className="mx-auto size-full overflow-hidden flex flex-col">
              <div className="flex-1 h-full overflow-hidden p-0 bg-red-50">
                <MessageScroller>
                  <MessageScrollerViewport className="flex flex-row  p-2">
                    <MessageScrollerContent className="m-4 w-full mx-auto max-w-3xl">
                      {new Array(40).fill(null).map((_, i) => (
                        <Message align="end" key={i}>
                          <MessageContent>
                            <Bubble>
                              <BubbleContent>
                                Deploying to prod real quick. {chatId}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      ))}
                    </MessageScrollerContent>
                    {menuShow && !toolsShow && (
                      <div className="sticky top-0 w-xs  max-h-full p-2">
                        <Card>
                          <CardHeader>123</CardHeader>
                        </Card>
                      </div>
                    )}
                  </MessageScrollerViewport>
                  <MessageScrollerButton
                    className={
                      menuShow && !toolsShow
                        ? "-translate-x-[calc(50%+10rem)]"
                        : ""
                    }
                  />
                </MessageScroller>
              </div>
              <div className="flex flex-row">
                <div className="m-4 w-full mx-auto max-w-3xl p-2">
                  <PromptInputProvider>
                    <PromptInput globalDrop multiple onSubmit={() => {}}>
                      <PromptInputBody>
                        <PromptInputTextarea className="scrollbar-thin" />
                      </PromptInputBody>
                      <PromptInputFooter>
                        <PromptInputTools />
                        <PromptInputSubmit />
                      </PromptInputFooter>
                    </PromptInput>
                  </PromptInputProvider>
                </div>
                {menuShow && !toolsShow && <div className="w-xs" />}
              </div>
            </div>
          </div>
        </MessageScrollerProvider>
      </div>
    </ResizablePanel>
  );
};

export default ChatPanel;
