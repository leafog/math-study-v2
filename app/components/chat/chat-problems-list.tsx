import { cn } from "~/lib/utils";
import {
  BadgeQuestionMark,
  Clock,
  FileQuestion,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActiveChat, useChatProblems } from "~/hooks/chat/active-chat";

import { scrollToProblem } from "~/components/math/scroll-utils";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import StatusIcon from "~/components/math/status-icon";

const ChatProblemsList = () => {
  const { t } = useTranslation();
  const { chatId } = useActiveChat();

  const { problems, problemHasanswers, problemHasExplanations } =
    useChatProblems();

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
            className={cn(
              "group flex items-center px-2 py-1.5 text-xs rounded-md hover:bg-accent transition-colors",
              pinnedId === p.id ? "bg-accent" : "",
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (p.tool_call_id) {
                  scrollToProblem(p.id, p.tool_call_id);
                }
              }}
              className="relative flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <StatusIcon status={p.status} />
              <span className="truncate">
                {p.description || p.content.slice(0, 40)}
              </span>
              <div
                className={cn(
                  "absolute right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-0.5 rounded bg-accent px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                  pinnedId === p.id ? "opacity-100" : "",
                )}
              >
                {problemHasanswers(p.id) && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer"
                    role="button"
                    tabIndex={-1}
                  >
                    <Clock className="size-3 text-muted-foreground" />
                  </span>
                )}
                {problemHasExplanations(p.id) && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer"
                    role="button"
                    tabIndex={-1}
                  >
                    <BadgeQuestionMark className="size-3 text-muted-foreground" />
                  </span>
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    togglePin(chatId, p.id);
                  }}
                  className={cn(
                    "shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer",
                  )}
                  role="button"
                  tabIndex={-1}
                >
                  {pinnedId === p.id ? (
                    <PinOffIcon className="size-3 text-primary" />
                  ) : (
                    <PinIcon className="size-3 text-muted-foreground" />
                  )}
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ChatProblemsList;
