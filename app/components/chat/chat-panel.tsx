import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
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
import { cn } from "~/lib/utils";
import { useDeferredValue, type CSSProperties, type PropsWithChildren } from "react";
import { useDebounce, useMeasure } from "@uidotdev/usehooks";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { ProblemPreviewSimple } from "../math/problem-preview-simple";
import ChatWelCome from "./chat-welcome";
import ChatPromptSuggestion from "./chat-prompt-suggestion";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { useDebounceCallback } from "usehooks-ts";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}
const ChatInnerWrapper = ({
  children,
  ref,
  style,
  menuShow,
  toolsShow,
  className,
  innerClassName,
}: PropsWithChildren<{
  ref?: React.RefCallback<HTMLDivElement>;
  style?: CSSProperties;
  menuShow: boolean;
  toolsShow: boolean;
  className: string;
  innerClassName?: string;
}>) => {
  return (
    <div
      className={cn("flex flex-row absolute w-full z-40", className)}
      ref={ref}
      style={style}
    >
      <div
        className={cn("min-w-0 w-full mx-auto max-w-3xl px-6", innerClassName)}
      >
        {children}
      </div>
      {menuShow && !toolsShow && (
        <div className="sticky top-0 w-xs  max-h-full p-2"></div>
      )}
    </div>
  );
};

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const { messages, status } = useActiveChatHelpers();
  const isStreaming = status === "streaming";
  // 流式期间用 useDeferredValue 降级渲染优先级，不阻塞用户交互
  const displayMessages =
    useDeferredValue(isStreaming ? messages : null) ?? messages;
  const { currentConversation, isNewChat } = useActiveChat();
  const onChatResize = useActiveChatToolsPanelStore().use.onChatResize();

  const onChatResizeDebounce = useDebounceCallback(onChatResize, 300);

  const [promptInputDivRef, { height: promptInputDivHeight }] = useMeasure();

  const [pinnedDivRef, { height: pinnedDivHeight }] = useMeasure();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const menuShow = useActiveChatToolsPanelStore().use.menuShow();

  const pinned = usePinnedProblems.use.pinned();

  const pinnedPid = chatId ? pinned[chatId] : undefined;
  const showPinned = chatId && pinnedPid;
  const hasSuggestions = useChatPromptSuggestionStore.use.hasSuggestions();
  const showSuggestions = hasSuggestions && isNewChat;
  const messageScrollerViewportStype = pinnedDivHeight
    ? {
        scrollPaddingTop: showPinned ? pinnedDivHeight + 16 : 0,
      }
    : {};
  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResizeDebounce(size)}
      className="flex flex-col "
    >
      <MessageScrollerProvider autoScroll>
        <ChatHeaderContainer
          className={cn("shrink-0", isNewChat ? "" : "border-b-2")}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="block truncate">
                {currentConversation?.title}
              </span>
            </div>
          </div>
          <div className="gap-2 flex">
            <ChatMenuBtn />
            {!toolsShow && <ToolsToggleBtn />}
          </div>
        </ChatHeaderContainer>
        <div className="grid grid-rows-1  relative w-full grow overflow-hidden ">
          <div className="overflow-hidden p-0">
            {showPinned && (
              <ChatInnerWrapper
                className="top-2"
                menuShow={menuShow}
                ref={pinnedDivRef}
                toolsShow={toolsShow}
                innerClassName="px-4"
              >
                <ProblemPreviewSimple
                  chatId={chatId}
                  problemId={pinnedPid}
                  pinnedDivHeight={pinnedDivHeight}
                />
              </ChatInnerWrapper>
            )}
            <MessageScroller>
              <MessageScrollerViewport
                className="flex flex-row"
                style={messageScrollerViewportStype}
              >
                <MessageScrollerContent className="min-w-0 w-full mx-auto max-w-3xl px-6 py-2">
                  {showPinned && (
                    <div style={{ height: `${pinnedDivHeight}px` }}></div>
                  )}
                  {displayMessages.map((message, i) => {
                    const isLast = i === displayMessages.length - 1;
                    return (
                      <MessageScrollerItem key={message.id} scrollAnchor={isLast}>
                        <ChatMessage
                          message={message}
                          isAnimating={status === "streaming" && isLast}
                        />
                      </MessageScrollerItem>
                    );
                  })}

                  <div style={{ height: `${promptInputDivHeight}px` }}></div>
                </MessageScrollerContent>
                {menuShow && !toolsShow && (
                  <div className="sticky top-0 w-xs h-full  p-2 overflow-hidden">
                    <ChatPanelRight />
                  </div>
                )}
              </MessageScrollerViewport>
              <MessageScrollerButton
                className={cn(
                  menuShow && !toolsShow
                    ? "-translate-x-[calc(50%+10rem)]"
                    : "",
                )}
                style={{
                  bottom: `calc(1rem + ${promptInputDivHeight}px + 0.5rem)`,
                }}
              />
            </MessageScroller>
            {isNewChat && (
              <ChatInnerWrapper
                className={cn("-translate-y-1/2  top-[calc((100%-140px)/2)]")}
                menuShow={menuShow}
                toolsShow={toolsShow}
              >
                <ChatWelCome />
              </ChatInnerWrapper>
            )}
            {showSuggestions && (
              <ChatInnerWrapper
                className={`z-50 `}
                style={{
                  bottom: `calc(${promptInputDivHeight}px + 1rem + 2rem)`,
                }}
                menuShow={menuShow}
                toolsShow={toolsShow}
              >
                <ChatPromptSuggestion />
              </ChatInnerWrapper>
            )}
            <ChatInnerWrapper
              ref={promptInputDivRef}
              menuShow={menuShow}
              toolsShow={toolsShow}
              className="bottom-4"
            >
              <ChatPromptInput />
            </ChatInnerWrapper>
          </div>
        </div>
      </MessageScrollerProvider>
    </ResizablePanel>
  );
};

export default ChatPanel;
