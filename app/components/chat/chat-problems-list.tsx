import { useLiveQuery, eq } from "@tanstack/react-db";
import { FileQuestion } from "lucide-react";
import { useActiveChat } from "~/hooks/chat/active-chat";
import { problemColl } from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";

const ChatProblemsList = () => {
  const { chatId } = useActiveChat();

  const { data: problems } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.chat_id, chatId))
        .orderBy(({ problemColl: col }) => col.created_at, {
          direction: "asc",
        }),
    [chatId],
  );

  if (!problems?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <FileQuestion className="size-5 opacity-40" aria-hidden="true" />
        <p className="text-xs">暂无题目</p>
      </div>
    );
  }

  const scrollToProblem = (id: string) => {
    const el = document.getElementById(`problem-${id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    // 元素已在视口中间 1/3 区域内，不滚动
    if (
      rect.top >= viewportHeight * 0.2 &&
      rect.bottom <= viewportHeight * 0.8
    ) {
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col">
      {(problems as ProblemType[]).map((p) => (
        <button
          onClick={() => scrollToProblem(p.id)}
          key={p.id}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-accent rounded-md transition-colors"
        >
          <span className="truncate">
            {p.description || p.content.slice(0, 40)}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ChatProblemsList;
