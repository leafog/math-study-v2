import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";

import ChatHeaderContainer from "./chat-header-container";
import ChatPromptInput from "./chat-prompt-input";

import ToolsToggleBtn from "./tools-toggle-btn";
import ChatMenuBtn from "./chat-menu-btn";

import ChatMessage from "./chat-message";
import {
  useActiveChat,
  useActiveChatHelpers,
  useActiveChatToolsPanelStore,
  useChatAgent,
} from "~/hooks/chat/active-chat";
import ChatPanelRight from "./chat-panel-right";
import { Marker, MarkerContent, MarkerIcon } from "../ui/marker";
import { Spinner } from "../ui/spinner";
import { cn } from "~/lib/utils";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { useMeasure } from "@uidotdev/usehooks";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { ProblemPreviewSimple } from "../math/problem-preview-simple";
import ChatWelcome from "./chat-welcome";
import ChatPromptSuggestion from "./chat-prompt-suggestion";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { useDebounceCallback } from "usehooks-ts";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import type { StickToBottomContext } from "use-stick-to-bottom";
import { withRef } from "~/lib/ref-utils";

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
      className={cn(
        "flex flex-row gap-8 absolute w-full z-40  scrollbar-gutter-both   overflow-auto px-4",
        className,
      )}
      ref={ref}
      style={style}
    >
      <div className={cn("min-w-0 w-full mx-auto max-w-3xl", innerClassName)}>
        {children}
      </div>
      {menuShow && !toolsShow && (
        <div className="sticky top-0  w-xs max-h-full   pr-4"></div>
      )}
    </div>
  );
};

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const { messages, status } = useActiveChatHelpers();
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

  const stickRef = useRef<StickToBottomContext>(null);
  useEffect(() => {
    withRef(stickRef, (it) => {
      const scrollEl = it.scrollRef?.current;
      if (scrollEl && promptInputDivHeight) {
        scrollEl.style.scrollPaddingBottom = `${promptInputDivHeight + 24}px`;
      }
    });
  }, [promptInputDivHeight, stickRef]);
  useEffect(() => {
    if (pinnedDivHeight) {
      withRef(stickRef, (it) => {
        const scrollEl = it.scrollRef?.current;
        if (scrollEl) {
          scrollEl.style.scrollPaddingTop = showPinned
            ? `${pinnedDivHeight + 16}px`
            : "0px";
        }
      });
    }
  }, [pinnedDivHeight, showPinned]);

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"100%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResizeDebounce(size)}
      className="flex relative flex-col "
    >
      <ChatHeaderContainer
        className={cn("shrink-0 px-4", isNewChat ? "" : "border-b-2")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="block truncate">{currentConversation?.title}</span>
          </div>
        </div>
        <div className="gap-2 flex">
          <ChatMenuBtn />
          {!toolsShow && <ToolsToggleBtn />}
        </div>
      </ChatHeaderContainer>
      {showPinned && (
        <ChatInnerWrapper
          className="top-12"
          menuShow={menuShow}
          ref={pinnedDivRef}
          toolsShow={toolsShow}
          innerClassName="p-0.5"
        >
          <ProblemPreviewSimple
            chatId={chatId}
            problemId={pinnedPid}
            pinnedDivHeight={pinnedDivHeight}
          />
        </ChatInnerWrapper>
      )}
      <Conversation contextRef={stickRef}>
        <ConversationContent
          className="flex flex-row"
          scrollClassName={cn("scrollbar-thin scroll-fade")}
        >
          <div className="min-w-0 w-full mx-auto max-w-3xl ">
            {showPinned && (
              <div style={{ height: `${pinnedDivHeight}px` }}></div>
            )}
            {messages.map((message, i) => {
              const isLast = i === messages.length - 1;

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isAnimating={status === "streaming" && isLast}
                />
              );
            })}
            <ConversationScrollButton
              className={cn(
                menuShow && !toolsShow ? "-translate-x-[calc(50%+10rem)]" : "",
              )}
              style={{
                bottom: `calc(1rem + ${promptInputDivHeight}px + 0.5rem)`,
              }}
            />
            <div style={{ height: `${promptInputDivHeight}px` }}></div>
          </div>

          {menuShow && !toolsShow && (
            <div className="  sticky top-2 h-full w-xs z-40 p-2 overflow-hidden">
              <ChatPanelRight />
            </div>
          )}
        </ConversationContent>
      </Conversation>
      {isNewChat && (
        <ChatInnerWrapper
          className={cn(
            "-translate-y-1/2   top-[calc((100%-140px)/2)] overflow-hidden py-4",
          )}
          menuShow={menuShow}
          toolsShow={toolsShow}
        >
          <ChatWelcome />
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
        innerClassName="py-2"
      >
        <ChatPromptInput />
      </ChatInnerWrapper>
    </ResizablePanel>
  );
};

export default ChatPanel;
