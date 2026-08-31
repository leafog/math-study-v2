import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { chatIconMap } from "./chat-constants";
import { bus } from "~/event/events";

const ChatPromptSuggestion = () => {
  const suggestions = useChatPromptSuggestionStore.use.suggestions();
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-2 text-sm scrollbar-none overflow-hidden">
      {suggestions.map((s, i) => {
        const Icon = chatIconMap[s.icon as keyof typeof chatIconMap];
        return (
          <motion.div
            className="w-full scrollbar-none"
            key={`${s.prev}-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: (suggestions.length - 1 - i) * 0.08,
              ease: "easeOut",
            }}
          >
            <Button
              className="flex items-center group text-start gap-0 hover:bg-transparent justify-start w-full "
              variant="ghost"
              onClick={() => {
                bus.emit("push-prompt-input", t(s.promptKey));
              }}
            >
              <div className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-current">
                {Icon && <Icon className="size-4" />}
                {t(s.prev)}
              </div>
              <span className={i18n.language?.startsWith("en") ? "ml-1" : ""}>
                {t(s.showKey)}
              </span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatPromptSuggestion;
