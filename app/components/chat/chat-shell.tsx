import { useEffect, useRef } from "react";
import { useParams } from "react-router";

import { ResizableHandle, ResizablePanelGroup } from "../ui/resizable";
import type { PanelImperativeHandle } from "react-resizable-panels";
import ToolsPanel from "./tools-panel";
import ChatPanel from "./chat-panel";
import { withRefs } from "~/lib/ref-utils";
import {
  useActiveChat,
  useActiveChatToolsPanelStore,
} from "~/hooks/chat/active-chat";

const ChatShell = () => {
  const { chatId } = useActiveChat();
  const toolsPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const zenMode = useActiveChatToolsPanelStore().use.zenMode();
  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const restoreChatPercentage =
    useActiveChatToolsPanelStore().use.restoreChatPercentage();
  const restoreToolsPercentage =
    useActiveChatToolsPanelStore().use.restoreToolsPercentage();

  useEffect(() => {
    withRefs({ toolsPanelRef, chatPanelRef }, ({ toolsPanel, chatPanel }) => {
      if (toolsShow) {
        if (zenMode) {
          toolsPanel.resize("100%");
        } else {
          chatPanel.resize(restoreChatPercentage);
          toolsPanel.resize(restoreToolsPercentage);
        }
      } else {
        toolsPanel.resize(0);
        chatPanel.resize("100%");
      }
    });
  }, [zenMode, toolsShow, chatId]);

  return (
    <div className="size-full flex flex-col">
      <ResizablePanelGroup className="w-full" orientation="horizontal">
        <ChatPanel panelRef={chatPanelRef} chatId={chatId} />
        <ResizableHandle withHandle />
        <ToolsPanel panelRef={toolsPanelRef} />
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatShell;
