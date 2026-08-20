import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { chatIconColors, chatIconMap } from "./chat-constants";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useMeasure } from "@uidotdev/usehooks";
import { cn } from "~/lib/utils";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { bus } from "~/event/event-bus";
import { useChatPromptProblems } from "~/store/chat-prompt-problems";

interface WelcomeAction {
  id: keyof typeof chatIconMap;
  labelKey: string;
}
const welcomeActions: WelcomeAction[] = [
  { id: "understand", labelKey: "welcome.understand" },
  { id: "solve-problem", labelKey: "welcome.practice" },
  { id: "knowledge-map", labelKey: "welcome.knowledgeMap" },
  { id: "review", labelKey: "welcome.review" },
];

const suggestionMap: Record<
  string,
  { prevKey: string; showKey: string; promptKey: string }[]
> = {
  understand: [
    {
      prevKey: "suggestion.prev.understand",
      showKey: "suggestion.show.understand.0",
      promptKey: "suggestion.prompts.understand.0",
    },
    {
      prevKey: "suggestion.prev.understand",
      showKey: "suggestion.show.understand.1",
      promptKey: "suggestion.prompts.understand.1",
    },
    {
      prevKey: "suggestion.prev.understand",
      showKey: "suggestion.show.understand.2",
      promptKey: "suggestion.prompts.understand.2",
    },
  ],
  "solve-problem": [
    {
      prevKey: "suggestion.prev.solve-problem",
      showKey: "suggestion.show.solve-problem.0",
      promptKey: "suggestion.prompts.solve-problem.0",
    },
    {
      prevKey: "suggestion.prev.solve-problem",
      showKey: "suggestion.show.solve-problem.1",
      promptKey: "suggestion.prompts.solve-problem.1",
    },
    {
      prevKey: "suggestion.prev.solve-problem",
      showKey: "suggestion.show.solve-problem.2",
      promptKey: "suggestion.prompts.solve-problem.2",
    },
  ],
  "knowledge-map": [
    {
      prevKey: "suggestion.prev.knowledge-map",
      showKey: "suggestion.show.knowledge-map.0",
      promptKey: "suggestion.prompts.knowledge-map.0",
    },
    {
      prevKey: "suggestion.prev.knowledge-map",
      showKey: "suggestion.show.knowledge-map.1",
      promptKey: "suggestion.prompts.knowledge-map.1",
    },
    {
      prevKey: "suggestion.prev.knowledge-map",
      showKey: "suggestion.show.knowledge-map.2",
      promptKey: "suggestion.prompts.knowledge-map.2",
    },
  ],
  review: [
    {
      prevKey: "suggestion.prev.review",
      showKey: "suggestion.show.review.0",
      promptKey: "suggestion.prompts.review.0",
    },
    {
      prevKey: "suggestion.prev.review",
      showKey: "suggestion.show.review.1",
      promptKey: "suggestion.prompts.review.1",
    },
    {
      prevKey: "suggestion.prev.review",
      showKey: "suggestion.show.review.2",
      promptKey: "suggestion.prompts.review.2",
    },
  ],
};

const CARD_MIN_WIDTH = 150;
const GAP = 16;
const MAX_COLS = 4;

const ChatWelcome = () => {
  const { t } = useTranslation();
  const [ref, { width }] = useMeasure();

  const cols = width
    ? Math.min(
        MAX_COLS,
        Math.max(1, Math.floor((width + GAP) / (CARD_MIN_WIDTH + GAP))),
      )
    : MAX_COLS;
  const textInputValue = useChatPromptInput().use.textInputValue();
  const hasInputValue = textInputValue.trim().length > 0;

  const setSuggestions = useChatPromptSuggestionStore.use.setSuggestions();
  const hasAny = useChatPromptInput().use.hasAny();

  return (
    <div ref={ref} className="flex flex-col gap-8 items-center">
      <div>
        <span className="text-3xl">{t("welcome.title")}</span>
      </div>
      <div
        className={cn(
          "grid gap-4 w-full ",
          hasAny && "opacity-0 pointer-events-none",
        )}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {welcomeActions.slice(0, cols).map((action, index) => {
          const Icon = chatIconMap[action.id];
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 16 }}
              animate={
                hasInputValue ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 }
              }
              transition={{
                duration: 0.5,
                delay: index * 0.12,
                ease: "easeOut",
              }}
              onClick={() => {
                const items = suggestionMap[action.id] ?? [];
                bus.emit("push-prompt-input", t(items[0].prevKey));
                setSuggestions(
                  items.map((item) => ({
                    icon: action.id,
                    prev: item.prevKey,
                    showKey: item.showKey,
                    promptKey: item.promptKey,
                  })),
                );
              }}
            >
              <Card className="hover:bg-muted h-full">
                <CardHeader>
                  <CardTitle>
                    <Icon className={cn("size-4", chatIconColors[action.id])} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>{t(action.labelKey)}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatWelcome;
