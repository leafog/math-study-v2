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

import ChatMessage from "./chat-message";
import {
  useActiveChat,
  useActiveChatHelpers,
  useActiveChatToolsPanelStore,
} from "~/hooks/chat/active-chat";
import ChatPanelRight from "./chat-panel-right";
import { Marker, MarkerContent, MarkerIcon } from "../ui/marker";
import { Spinner } from "../ui/spinner";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const { messages, status } = useActiveChatHelpers();
  const { currentConversation } = useActiveChat();
  const onChatResize = useActiveChatToolsPanelStore().use.onChatResize();

  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();
  const isThinking = status === "submitted";

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResize(size)}
      className="flex flex-col"
    >
      <MessageScrollerProvider autoScroll>
        <ChatHeaderContainer className="shrink-0 border-b-2">
          <div className="min-w-0 flex-1">
            <span className="block truncate">{currentConversation?.title}</span>
          </div>
          <div className="gap-2 flex">
            <ChatMenuBtn />
            {!toolsShow && <ToolsToggleBtn />}
          </div>
        </ChatHeaderContainer>
        <div className="grid grid-rows-1 content-between relative w-full grow overflow-hidden ">
          <div className="overflow-hidden p-0">
            <MessageScroller>
              <MessageScrollerViewport className="flex flex-row ">
                <MessageScrollerContent className="min-w-0 w-full mx-auto max-w-3xl px-6 py-2">
                  {messages.map((message, i) => {
                    return (
                      <ChatMessage
                        message={message}
                        key={message.id}
                        isAnimating={
                          status === "streaming" && i === messages.length - 1
                        }
                      />
                    );
                  })}
                  {isThinking && (
                    <Marker role="status">
                      <MarkerIcon>
                        <Spinner />
                      </MarkerIcon>
                      <MarkerContent className="shimmer">
                        Thinking...
                      </MarkerContent>
                    </Marker>
                  )}
                </MessageScrollerContent>
                {menuShow && !toolsShow && (
                  <div className="sticky top-0 w-xs h-full p-2 overflow-hidden">
                    <ChatPanelRight />
                  </div>
                )}
              </MessageScrollerViewport>
              <MessageScrollerButton
                className={
                  menuShow && !toolsShow ? "-translate-x-[calc(50%+10rem)]" : ""
                }
              />
            </MessageScroller>
          </div>
          <div className="flex flex-row ">
            <div className="min-w-0 w-full mx-auto max-w-3xl px-6 py-2">
              <ChatPromptInput />
            </div>
            {menuShow && !toolsShow && (
              <div className="sticky top-0 w-xs  max-h-full p-2"></div>
            )}
          </div>
        </div>
      </MessageScrollerProvider>
    </ResizablePanel>
  );
};

export default ChatPanel;
