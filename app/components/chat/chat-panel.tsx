import type { PanelImperativeHandle } from "react-resizable-panels";
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
} from "~/hooks/chat/active-chat";
import ChatPanelRight from "./chat-panel-right";
import { cn } from "~/lib/utils";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { useMeasure } from "@uidotdev/usehooks";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { ProblemPreviewSimple } from "../math/problem-preview-simple";
import ChatWelcome from "./chat-welcome";
import ChatPromptSuggestion from "./chat-prompt-suggestion";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { conversationColl } from "~/db/tdb-collections";
import { useDebounceCallback } from "usehooks-ts";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDownIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useChatProblemScroll } from "./use-chat-problem-scroll";

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
  className?: string;
  innerClassName?: string;
}>) => {
  return (
    <div
      className={cn(
        "flex flex-row  absolute w-full z-40  scrollbar-gutter-stable   overflow-auto px-4 ",
        className,
      )}
      ref={ref}
      style={style}
    >
      <div className={cn("min-w-0 w-full mx-auto max-w-3xl ", innerClassName)}>
        {children}
      </div>
      {menuShow && !toolsShow && (
        <div className="sticky top-0  w-xs max-h-full   "></div>
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

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  const saveTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed && currentConversation) {
      conversationColl.update(currentConversation.id, (draft) => {
        draft.title = trimmed;
        draft.updated_at = new Date();
      });
    }
    setEditingTitle(false);
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const mt = useMemo(
    () => (showPinned ? (pinnedDivHeight ?? 0) : 0) + 16,
    [showPinned, pinnedDivHeight],
  );
  const mb = useMemo(
    () => (promptInputDivHeight ?? 0) + 8,
    [promptInputDivHeight],
  );

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 72,
    getItemKey: (index) => messages[index]!.id,
    anchorTo: "end",
    followOnAppend: true,
    scrollEndThreshold: mb + 8,
    overscan: 3,
    useFlushSync: false,
    scrollPaddingStart: mt,
    paddingStart: mt,
    paddingEnd: mb,
  });

  useLayoutEffect(() => {
    virtualizer.scrollToEnd({
      behavior: "instant",
    });
  }, [chatId]);

  useChatProblemScroll({ virtualizer, scrollRef, messages });

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
        className={cn("shrink-0 px-4", isNewChat ? "" : "border-b")}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <Input
                ref={titleInputRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") setEditingTitle(false);
                }}
                onBlur={saveTitle}
                className="w-fit min-w-fit field-sizing-content px-1 [font-size:inherit] leading-[inherit]"
              />
            ) : (
              <Button
                variant={"ghost"}
                onClick={() => {
                  if (!currentConversation) return;
                  setEditingTitle(true);
                  setTitleValue(currentConversation.title ?? "");
                }}
              >
                {currentConversation?.title}
              </Button>
            )}
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
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scroll-fade scrollbar-gutter-stable "
      >
        <div className="flex flex-row min-h-full px-4">
          <div className="min-w-0 w-full mx-auto max-w-3xl relative ">
            <div
              className="relative w-full"
              style={{
                height: virtualizer.getTotalSize(),
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const message = messages[virtualRow.index];
                if (!message) return null;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: "2rem",
                    }}
                  >
                    <ChatMessage
                      message={message}
                      isAnimating={
                        status === "streaming" &&
                        virtualRow.index === messages.length - 1
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {menuShow && !toolsShow && (
            <div className="sticky top-2 h-full w-xs z-40 p-2 overflow-hidden">
              <ChatPanelRight />
            </div>
          )}
        </div>
      </div>
      {!virtualizer.isAtEnd() && (
        <ChatInnerWrapper
          menuShow={menuShow}
          toolsShow={toolsShow}
          className="items-center mx-auto"
          innerClassName="mx-auto flex items-center justify-center"
          style={{
            bottom: `calc(2rem + ${promptInputDivHeight ?? 0}px)`,
          }}
        >
          <Button
            onClick={() => virtualizer.scrollToEnd({ behavior: "smooth" })}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowDownIcon className="size-4" />
          </Button>
        </ChatInnerWrapper>
      )}
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
        className="bottom-4 "
        innerClassName="py-2"
      >
        <ChatPromptInput />
      </ChatInnerWrapper>
    </ResizablePanel>
  );
};

export default ChatPanel;
