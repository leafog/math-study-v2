import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import ToolTab from "./tool-tab";
import { Separator } from "../ui/separator";
import { useChatTools } from "~/hooks/chat/active-chat";
import { kindToTool } from "./tools";
import ToolsBarOpenBtn from "./tools-bar-open-btn";
import { DragDropProvider, type DragDropEventHandlers } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";

function SortableTab({
  id,
  index,
  showSeparator,
  children,
}: Readonly<{
  id: string;
  index: number;
  showSeparator?: boolean;
  children: ReactNode;
}>) {
  const { ref, isDragging } = useSortable({ id, index, group: "tools" });

  return (
    <div
      className="flex gap-1 items-center"
      ref={ref}
      data-tool-id={id}
      data-dragging={isDragging}
      style={{ opacity: isDragging ? 0.4 : undefined }}
    >
      {children}
      <Separator
        className={`scale-y-[0.6] ${!showSeparator ? "opacity-0" : ""}`}
        orientation="vertical"
      />
    </div>
  );
}

const ToolsBar = () => {
  const { tools, hasTools, close, active, activeId, reorder } = useChatTools();
  const scrollRef = useRef<HTMLDivElement>(null);
  const toolsIds = tools.map((it) => it.id);
  const idx = activeId ? toolsIds.indexOf(activeId) : -1;
  const hiddenSepIds =
    idx === -1 ? [] : idx === 0 ? [activeId] : [toolsIds[idx - 1], activeId];

  useEffect(() => {
    if (!activeId) return;

    const el = scrollRef.current?.querySelector(`[data-tool-id="${activeId}"]`);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeId]);

  const handleDragEnd: DragDropEventHandlers["onDragEnd"] = (event) => {
    const source = event.operation.source;
    if (!source || !isSortable(source)) return;
    const ids = tools.map((t) => t.id);
    const [moved] = ids.splice(source.initialIndex, 1);
    ids.splice(source.index, 0, moved);
    reorder(ids);
  };
  const handleDragStart: DragDropEventHandlers["onDragStart"] = (event) => {
    const source = event.operation.source;
    if (!source) return;
    active(String(source.id));
  };

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={scrollRef}
        className="flex flex-1 min-w-0 flex-row items-center  gap-1 overflow-x-auto scrollbar-none scroll-smooth overscroll-none"
      >
        {tools.map(({ id, kind, title }, index) => {
          const Icon = kindToTool(kind)?.Icon!!;
          return (
            <SortableTab
              key={id}
              id={id}
              index={index}
              showSeparator={
                !hiddenSepIds.includes(id) && index < tools.length - 1
              }
            >
              <ToolTab
                title={title}
                active={id === activeId}
                icon={<Icon size={16} />}
                onClick={() => active(id)}
                onClose={() => {
                  close(id);
                }}
              />
            </SortableTab>
          );
        })}
        {hasTools && <ToolsBarOpenBtn />}
      </div>
    </DragDropProvider>
  );
};

export default ToolsBar;
