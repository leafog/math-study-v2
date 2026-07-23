import { useLiveQuery, eq } from "@tanstack/react-db";
import { FileQuestion } from "lucide-react";
import { useActiveChat } from "~/hooks/chat/active-chat";
import { problemColl } from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";
import { useMessageScrollerVisibility } from "@shadcn/react/message-scroller";
import { useEffect } from "react";

const ChatProblemsList = () => {
  const { chatId } = useActiveChat();

  const { data: problems } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.chat_id, chatId))
        .orderBy(({ problemColl: col }) => col.created_at, {
          direction: "desc",
        }),
    [chatId],
  );

  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  useEffect(() => {
    console.log(currentAnchorId, visibleMessageIds);
  }, [currentAnchorId, visibleMessageIds]);
  if (!problems?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <FileQuestion className="size-5 opacity-40" aria-hidden="true" />
        <p className="text-xs">暂无题目</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {(problems as ProblemType[]).map((p) => (
        <button
          key={p.id}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-accent rounded-md transition-colors"
        >
          {/* <span className="shrink-0 text-muted-foreground">
            {p.source === "photo" ? "📷" : p.source === "ai" ? "🤖" : "📝"}
          </span> */}
          <span className="truncate">
            {p.description || p.content.slice(0, 40)}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ChatProblemsList;
