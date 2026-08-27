import { forwardRef, useEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { Link } from "react-router";
import { Archive, PinIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import { SidebarMenuButton, SidebarMenuItem } from "~/components/ui/sidebar";

interface ChatSidebarItemProps {
  chat: { id: string; title?: string };
  isActive?: boolean;
  /** 是否已置顶（决定 Pin 图标高亮） */
  pinned?: boolean;
  /** 拖拽中（用于 dnd-kit sortable 的透明度反馈） */
  dragging?: boolean;
  /** 保存方法（由父组件提供） */
  onRename: (id: string, title: string) => void;
  /** 点击置顶按钮回调 */
  onTogglePin?: (id: string) => void;
  /** 点击归档按钮回调 */
  onArchive?: (id: string) => void;
}

/**
 * 会话侧栏项：标题(可双击改名) + 置顶操作。
 * 历史列表与置顶列表共用。保存逻辑在父组件，这里只负责编辑 UI 并在保存时回调。
 * ref 转发到主按钮（整个可点击行），供 dnd-kit 挂 sortable。
 */
export const ChatSidebarItem = forwardRef<
  HTMLButtonElement,
  ChatSidebarItemProps
>(function ChatSidebarItem(
  {
    chat,
    isActive,
    pinned,
    dragging,
    onRename,
    onTogglePin,
    onArchive,
  }: ChatSidebarItemProps,
  ref: Ref<HTMLButtonElement>,
) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(chat.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = titleValue.trim();
    if (trimmed) {
      onRename(chat.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        ref={ref}
        asChild
        isActive={isActive}
        className={dragging ? "opacity-40" : undefined}
        onDoubleClick={(e) => {
          setTitleValue(chat.title ?? "");
          setEditing(true);
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            defaultValue={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            onBlur={save}
            className="w-full truncate border-0 bg-transparent p-0 text-inherit shadow-none outline-none ring-0 focus-visible:ring-0"
          />
        ) : (
          <Link
            to={`/chat/${chat.id}`}
            className="group/pin flex w-full items-center text-left gap-2 line-clamp-1 truncate"
          >
            <span className="min-w-0 flex-1 truncate">{chat.title}</span>

            {onTogglePin && (
              <PinIcon
                className={cn(
                  "opacity-0 transition-opacity group-hover/pin:opacity-100",
                  pinned && "text-primary",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePin(chat.id);
                }}
              />
            )}
            {onArchive && (
              <Archive
                className="opacity-0 transition-opacity group-hover/pin:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onArchive(chat.id);
                }}
              />
            )}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

export default ChatSidebarItem;
