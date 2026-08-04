import { cn } from "~/lib/utils";
import { FileQuestion, PinIcon, PinOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActiveChat, useChatProblems } from "~/hooks/chat/active-chat";

import { scrollToProblem } from "~/components/math/scroll-utils";
import { usePinnedProblems } from "~/store/pinned-problems-store";

const ChatProblemsList = () => {
  const { t } = useTranslation();
  const { chatId } = useActiveChat();

  const { problems, toStateColorByPid } = useChatProblems();
  const pinned = usePinnedProblems((s) => s.pinned);
  const togglePin = usePinnedProblems((s) => s.toggle);
  const pinnedId = pinned[chatId];

  if (!problems?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <FileQuestion className="size-5 opacity-40" aria-hidden="true" />
        <p className="text-xs">{t("problem.empty")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {problems.map((p) => {
        return (
          <div
            key={p.id}
            className="group flex items-center gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors"
          >
            <button
              onClick={() => scrollToProblem(p.id)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <span
                className={`size-2 shrink-0 rounded-full ${toStateColorByPid(p.id)}`}
              />
              <span className="truncate">
                {p.description || p.content.slice(0, 40)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(chatId, p.id);
              }}
              className={cn(
                "shrink-0 transition-opacity",
                pinnedId === p.id
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            >
              {pinnedId === p.id ? (
                <PinOffIcon className="size-3 text-primary" />
              ) : (
                <PinIcon className="size-3 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ChatProblemsList;
