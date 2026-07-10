import { useEffect, useRef } from "react";
import { useParams } from "react-router";

import { ResizableHandle, ResizablePanelGroup } from "../ui/resizable";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { useChatToolsPanelStore } from "~/store/chat-tools-panel-store";
import { withRefs } from "~/lib/ref-utils";
import ToolsPanel from "./tools-panel";
import ChatPanel from "./chat-panel";

const ChatShell = () => {
  const { id } = useParams();
  const toolsPanelRef = useRef<PanelImperativeHandle>(null);
  const chatPanelRef = useRef<PanelImperativeHandle>(null);
  const chatSize = useChatToolsPanelStore.use.chatSize();
  const toolsClosed = useChatToolsPanelStore.use.toolsClosed();
  const restoreChatPercentage =
    useChatToolsPanelStore.use.restoreChatPercentage();
  const restoreToolsPercentage =
    useChatToolsPanelStore.use.restoreToolsPercentage();
  const toolsZenMod = useChatToolsPanelStore.use.toolsZenMod();

  const onToolsTrigger = () => {
    withRefs({ toolsPanelRef, chatPanelRef }, ({ toolsPanel, chatPanel }) => {
      if (toolsClosed) {
        if (toolsZenMod) {
          chatPanel.resize(0);
          toolsPanel.resize("100%");
        } else {
          toolsPanel.resize(restoreToolsPercentage);
        }
      } else {
        chatPanel.resize("100%");
        toolsPanel.resize(0);
      }
    });
  };

  useEffect(() => {
    withRefs({ chatPanelRef }, ({ chatPanel }) => {
      if (toolsZenMod) {
        if (chatSize.asPercentage !== 0) {
          chatPanel.resize(0);
        }
      } else if (toolsClosed === false) {
        chatPanel.resize(restoreChatPercentage);
      }
    });
  }, [toolsZenMod]);

  return (
    <div className="size-full flex flex-col">
      <ResizablePanelGroup className="w-full grow" orientation="horizontal">
        <ChatPanel
          panelRef={chatPanelRef}
          onToolsTrigger={onToolsTrigger}
          chatId={id}
        />
        <ResizableHandle withHandle />
        <ToolsPanel panelRef={toolsPanelRef} onToolsTrigger={onToolsTrigger} />
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatShell;
