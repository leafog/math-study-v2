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

import ChatHeaderContainer from "./chat-header-container";
import ChatPromptInput from "./chat-prompt-input";

import ToolsToggleBtn from "./tools-toggle-btn";
import ChatMenuBtn from "./chat-menu-btn";
import { useChatMenuBtnStore } from "~/store/chat-menu-store";
import { Card, CardHeader } from "../ui/card";

import ChatMessage from "./chat-message";
import { useActiveChat } from "~/hooks/chat/use-active-chat";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { chatToolsPanelStatesColl } from "~/db/tdb-collections";
import { useEffect } from "react";

interface ChatPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
  chatId?: string;
}

const ChatPanel = ({ panelRef, chatId }: ChatPanelProps) => {
  const { id, isNewChat } = useActiveChat();
  const onChatResize = useChatToolsPanelStore.use.onChatResize();

  const { data } = useLiveQuery(
    (q) =>
      q
        .from({ chatToolsPanelStatesColl })
        .where(({ chatToolsPanelStatesColl }) =>
          eq(chatToolsPanelStatesColl.conversationId, id),
        )
        .findOne(),
    [id, isNewChat],
  );

  const { messages, status } = useActiveChat();

  const toolsShow = useChatToolsPanelStore.use.toolsShow();
  const menuShow = useChatMenuBtnStore.use.value();

  useEffect(() => {
    console.log(data, status);
  }, [data]);

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
        <MessageScrollerProvider autoScroll>
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
