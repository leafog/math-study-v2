import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";

import ChatHeaderContainer from "./chat-header-container";
import ChatPromptInput from "./chat-prompt-input";

import ToolsToggleBtn from "./tools-toggle-btn";
import ChatMenuBtn from "./chat-menu-btn";
import { Card, CardHeader } from "../ui/card";

import ChatMessage from "./chat-message";
import {
  useActiveChat,
  useActiveChatHelpers,
  useActiveChatToolsPanelStore,
} from "~/hooks/chat/active-chat";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const { messages } = useActiveChatHelpers();
  const { currentConversation } = useActiveChat();
  const onChatResize = useActiveChatToolsPanelStore().use.onChatResize();

  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();

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
        <div>
          <span>{currentConversation?.title}</span>
        </div>
        <div className="gap-2 flex">
          <ChatMenuBtn />
          {!toolsShow && <ToolsToggleBtn />}
        </div>
      </ChatHeaderContainer>
      <div className="flex flex-row relative w-full grow overflow-hidden">
        <MessageScrollerProvider autoScroll>
          <div className="w-full  h-full ">
            <div className="mx-auto h-full overflow-hidden flex flex-col">
              <div className="h-full overflow-hidden p-0">
                <MessageScroller>
                  <MessageScrollerViewport className="flex flex-row ">
                    <MessageScrollerContent className="w-full mx-auto max-w-3xl px-6 py-2">
                      {messages.map((message) => {
                        return (
                          <ChatMessage message={message} key={message.id} />
                        );
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
                  <ChatPromptInput />
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
