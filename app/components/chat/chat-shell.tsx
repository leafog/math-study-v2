import { useEffect, useRef } from "react";
import { useParams } from "react-router";

import { ResizableHandle, ResizablePanelGroup } from "../ui/resizable";
import type { PanelImperativeHandle } from "react-resizable-panels";
import ToolsPanel from "./tools-panel";
import ChatPanel from "./chat-panel";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { withRefs } from "~/lib/ref-utils";

const ChatShell = () => {
  const { id } = useParams();
  const toolsPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const zenMode = useChatToolsPanelStore.use.zenMode();
  const toolsShow = useChatToolsPanelStore.use.toolsShow();
  const restoreChatPercentage =
    useChatToolsPanelStore.use.restoreChatPercentage();
  const restoreToolsPercentage =
    useChatToolsPanelStore.use.restoreToolsPercentage();
  useEffect(() => {
    console.log("hehe");
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
  }, [zenMode, toolsShow]);

  return (
    <div className="size-full flex flex-col">
      <ResizablePanelGroup className="w-full grow" orientation="horizontal">
        <ChatPanel panelRef={chatPanelRef} chatId={id} />
        <ResizableHandle withHandle />
        <ToolsPanel panelRef={toolsPanelRef} />
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatShell;
