import type { PanelImperativeHandle } from "react-resizable-panels";
import { ResizablePanel } from "../ui/resizable";
import ChatHeaderContainer from "./chat-header-container";
import ToolsToggleBtn from "./tools-toggle-btn";
import ToolsZentoggleBtn from "./tools-zen-toogle-btn";
import ToolsGreeting from "./tools-greeting";
import ToolsBar from "./tools-bar";
import {
  useActiveChat,
  useActiveChatToolsPanelStore,
  useChatTools,
} from "~/hooks/chat/active-chat";
import { kindToTool } from "./tools";
import { cn } from "~/lib/utils";
import { chatToolInstanceColl } from "~/db/tdb-collections";
import type { ToolPanelProps } from "~/components/chat/tools/types";
import { useDebounceCallback } from "usehooks-ts";

interface ToolsPanelProps {
  panelRef: React.RefObject<PanelImperativeHandle | null>;
}

// TODO: 工具 Panel 可通过 data-active 属性感知激活状态自行聚焦
// 例: 父容器 [data-active="true"] 时调用 apiRef.current?.focus()
const ToolPanelContent = ({
  chatId,
  kind,
  id,
  refId,
  init,
}: {
  id: string;
  chatId: string;
  kind: string;
  refId?: string;
  init: unknown;
}) => {
  const { Panel } = kindToTool(kind)!;
  const handleChange: ToolPanelProps["onChange"] = (value) => {
    chatToolInstanceColl.update(id, (draft) => {
      draft.data = value;
    });
  };
  return (
    <Panel
      kind={kind}
      id={id}
      chatId={chatId}
      refId={refId}
      init={init}
      onChange={handleChange}
    />
  );
};
const ToolsPanel = ({ panelRef }: ToolsPanelProps) => {
  const onToolsResize = useActiveChatToolsPanelStore().use.onToolsResize();
  const onChatResizeDebounce = useDebounceCallback(onToolsResize, 300);

  const toolsShow = useActiveChatToolsPanelStore().use.toolsShow();
  const { hasTools, activeId, mountedTools } = useChatTools();
  const { chatId } = useActiveChat();

  return (
    <ResizablePanel
      panelRef={panelRef}
      defaultSize={"0%"}
      minSize={"30%"}
      collapsible
      onResize={(size) => onChatResizeDebounce(size)}
      className="flex flex-col w-full "
    >
      <ChatHeaderContainer>
        <div className="overflow-hidden">
          <ToolsBar />
        </div>

        {toolsShow && (
          <div className="flex gap-2">
            <ToolsZentoggleBtn />
            <ToolsToggleBtn />
          </div>
        )}
      </ChatHeaderContainer>
      <div className="flex-1 relative overflow-visible">
        {!hasTools ? (
          <ToolsGreeting />
        ) : (
          mountedTools.map(({ kind, id, data, ref_id }) => {
            const isActive = id === activeId;
            return (
              <div
                key={`${chatId}-${id}`}
                className={cn(
                  "absolute inset-0 flex flex-col",
                  isActive ? "" : "hidden",
                )}
              >
                <ToolPanelContent
                  chatId={chatId}
                  kind={kind}
                  id={id}
                  refId={ref_id}
                  init={data}
                />
              </div>
            );
          })
        )}
      </div>
    </ResizablePanel>
  );
};

export default ToolsPanel;
