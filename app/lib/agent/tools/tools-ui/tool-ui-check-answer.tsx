import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { useEffect } from "react";
import { useBoolean } from "usehooks-ts";
import confetti from "canvas-confetti";
import { ToolBlock } from "./_tool-common";

import { Badge } from "~/components/ui/badge";
import { ANSWER_COLORS } from "~/components/math/constants";
import { cn } from "~/lib/utils";
import StatusIcon from "~/components/math/status-icon";
import MathResBlock from "~/components/math/math-res-block";

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
    <ToolBlock title={t("toolCall.title.checkAnswer")} part={part}>
      {part.state === "output-available" && (
        <>
          {part.output.correct ? (
            <Badge
              className={cn(
                ANSWER_COLORS.correct.bg,
                ANSWER_COLORS.correct.text,
                ANSWER_COLORS.correct.border,
              )}
            >
              <StatusIcon status="correct" />
              {t("toolCall.answerCorrect")}
            </Badge>
          ) : (
            <Badge
              className={cn(
                ANSWER_COLORS.incorrect.bg,
                ANSWER_COLORS.incorrect.text,
                ANSWER_COLORS.incorrect.border,
              )}
            >
              <StatusIcon status="incorrect" />
              {t("toolCall.answerInCorrect")}
            </Badge>
          )}
          {(part.output.user_answer || part.output.analysis) && (
            <div className="space-y-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
              {part.output.user_answer && (
                <div className="flex items-start gap-2">
                  <span className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                    {t("problem.yourAnswer")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <MathResBlock>{part.output.user_answer}</MathResBlock>
                  </div>
                </div>
              )}
              {part.output.analysis && (
                <div className="border-t border-muted/60 pt-2">
                  <MathResBlock>{part.output.analysis}</MathResBlock>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </ToolBlock>
  );
};
