import { useLiveQuery, eq } from "@tanstack/react-db";
import { FileQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActiveChat } from "~/hooks/chat/active-chat";
import { problemColl, answerRecordColl } from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";
import { useMemo } from "react";

const ChatProblemsList = () => {
  const { t } = useTranslation();
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

  const { data: answers } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) => eq(col.conversation_id, chatId)),
    [chatId],
  );

  // Map problem_id → latest answer correct status
  const answerStatus = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!answers) return map;
    for (const a of answers) {
      if (!map.has(a.problem_id)) {
        map.set(a.problem_id, a.correct);
      }
    }
    return map;
  }, [answers]);

  if (!problems?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <FileQuestion className="size-5 opacity-40" aria-hidden="true" />
        <p className="text-xs">{t("problem.empty")}</p>
      </div>
    );
  }

  const scrollToProblem = (id: string) => {
    const el = document.getElementById(`problem-${id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
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
      {(problems as ProblemType[]).map((p) => {
        const status = answerStatus.get(p.id);
        return (
          <button
            onClick={() => scrollToProblem(p.id)}
            key={p.id}
            className="flex items-center gap-2 px-2 py-1.5 text-xs text-left hover:bg-accent rounded-md transition-colors"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${
                status === undefined
                  ? "bg-muted-foreground/20"
                  : status
                    ? "bg-primary"
                    : "bg-destructive"
              }`}
            />
            <span className="truncate">
              {p.description || p.content.slice(0, 40)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ChatProblemsList;
