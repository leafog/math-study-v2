import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { useEffect } from "react";
import { useBoolean } from "usehooks-ts";
import confetti from "canvas-confetti";
import { ToolInline } from "./_tool-common";
import { Check, X } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { PROBLEM_STATE_COLORS } from "~/components/math/constants";

export const CheckAnswer = ({
  part,
}: ToolRendererProps<"tool-checkAnswer">) => {
  const { t } = useTranslation();
  const { value: hasInputStreaming, setTrue } = useBoolean(false);

  useEffect(() => {
    if (part.state === "input-streaming") {
      setTrue();
    }
  }, [part.state, setTrue]);

  useEffect(() => {
    if (
      part.state === "output-available" &&
      part.output.correct &&
      hasInputStreaming
    ) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [part.state, part.output?.correct, hasInputStreaming]);

  return (
    <ToolInline title={t("toolCall.title.checkAnswer")} part={part}>
      {part.state === "output-available" &&
        (part.output.correct ? (
          <Badge className={PROBLEM_STATE_COLORS.correct}>
            <Check data-icon="inline-start" />
            {t("toolCall.answerCorrect")}
          </Badge>
        ) : (
          <Badge className={PROBLEM_STATE_COLORS.incorrect}>
            <X data-icon="inline-start" />
            {t("toolCall.answerInCorrect")}
          </Badge>
        ))}
    </ToolInline>
  );
};
