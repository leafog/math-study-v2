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

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "~/components/ai-elements/prompt-input";
import ChatHeaderContainer from "./chat-header-container";

import ToolsToggleBtn from "./tools-toggle-btn";
import ChatMenuBtn from "./chat-menu-btn";
import { useChatMenuBtnStore } from "~/store/chat-menu-store";
import { Card, CardHeader } from "../ui/card";
import { useActiveChat } from "~/hooks/chat/use-active-chat";

import ChatMessage from "./chat-message";
import { useNavigate } from "react-router";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const onChatResize = useChatToolsPanelStore.use.onChatResize();
  const toolsShow = useChatToolsPanelStore.use.toolsShow();
  const menuShow = useChatMenuBtnStore.use.value();
  const { messages, sendMessage, status, id } = useActiveChat();
  const navigate = useNavigate();

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResize(size)}
      className="flex flex-col"
    >
      <ChatHeaderContainer className="border-b-2">
        <span className="h-10"></span>
        <div className="gap-2 flex">
          <ChatMenuBtn />
          {!toolsShow && <ToolsToggleBtn />}
        </div>
      </ChatHeaderContainer>
      <div className="flex flex-row relative w-full grow overflow-hidden">
        <MessageScrollerProvider>
          <div className="w-full  h-full ">
            <div className="mx-auto h-full overflow-hidden flex flex-col">
              <div className="h-full overflow-hidden p-0">
                <MessageScroller>
                  <MessageScrollerViewport className="flex flex-row ">
                    <MessageScrollerContent className="w-full mx-auto max-w-3xl px-6 py-2">
                      {messages.map((message, i) => {
                        return <ChatMessage message={message} key={i} />;
                      })}
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
              <div className="flex flex-row flex-none">
                <div className="w-full mx-auto max-w-3xl p-6">
                  <PromptInputProvider>
                    <PromptInput
                      globalDrop
                      multiple
                      onSubmit={(message) => {
                        navigate(`/chat/${id}`);
                        sendMessage(message);
                      }}
                    >
                      <PromptInputBody>
                        <PromptInputTextarea className="scrollbar-thin" />
                      </PromptInputBody>
                      <PromptInputFooter>
                        <PromptInputTools />
                        <PromptInputSubmit status={status} />
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
