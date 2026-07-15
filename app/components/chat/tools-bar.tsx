import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import ToolTab from "./tool-tab";
import { Separator } from "../ui/separator";
import { useChatTools } from "~/hooks/chat/active-chat";
import { kindToTool } from "./tools";
import ToolsBarOpenBtn from "./tools-bar-open-btn";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useResizeObserver } from "usehooks-ts";
import { useMeasure } from "@uidotdev/usehooks";

function SortableTab({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: ReactNode;
}) {
  const { ref, isDragging } = useSortable({ id, index, group: "tools" });

  return (
    <div
      ref={ref}
      data-tool-id={id}
      data-dragging={isDragging}
      style={{ opacity: isDragging ? 0.4 : undefined }}
    >
      {children}
    </div>
  );
}

const ToolsBar = () => {
  const { tools, hasTools, close, active, activeId, reorder } = useChatTools();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeId) return;

    const el = scrollRef.current?.querySelector(`[data-tool-id="${activeId}"]`);
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeId]);

  const handleDragEnd = useCallback(
    (event: any) => {
      const source = event.operation.source as
        { initialIndex: number; index: number } | undefined;
      if (!source) return;
      const ids = tools.map((t) => t.id);
      const [moved] = ids.splice(source.initialIndex, 1);
      ids.splice(source.index, 0, moved);
      reorder(ids);
    },
    [tools, reorder],
  );

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div
        ref={scrollRef}
        className="flex h-full min-w-0 flex-row items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth overscroll-none"
      >
        {tools.map(({ id, kind, title }, index) => {
          const Icon = kindToTool(kind)?.Icon!!;
          return (
            <SortableTab key={id} id={id} index={index}>
              <ToolTab
                title={title}
                active={id === activeId}
                icon={<Icon size={16} />}
                onClick={() => active(id)}
                onClose={() => {
                  close(id);
                }}
              />
              <Separator
                orientation="vertical"
                className="self-center scale-y-60"
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
