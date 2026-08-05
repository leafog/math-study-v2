import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { useChatPromptSuggestionStore } from "~/store/chat-prompt-suggestion-store";
import { chatIconMap } from "./chat-constants";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { getPrompt } from "~/lib/agent/instructions";

const ChatPromptSuggestion = () => {
  const suggestions = useChatPromptSuggestionStore.use.suggestions();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("en") ? "en" : "zh";
  const setPushToTextInputValue =
    useChatPromptInput().use.setPushToTextInputValue();
  return (
    <div className="flex flex-col gap-2 text-sm">
      {suggestions.map((s, i) => {
        const Icon = chatIconMap[s.icon as keyof typeof chatIconMap];
        return (
          <motion.div
            className="w-full"
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
                setPushToTextInputValue(getPrompt(s.promptKey, { locale }));
              }}
            >
              <div className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-current">
                {Icon && <Icon className="size-4" />}
                {t(s.prev)}
              </div>
              <span className={locale === "en" ? "ml-1" : ""}>
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
