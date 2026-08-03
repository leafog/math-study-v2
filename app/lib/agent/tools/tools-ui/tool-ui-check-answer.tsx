import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolMessageRendererProps } from "./types";

function CheckAnswerRenderer({ part }: ToolMessageRendererProps) {
  const { t } = useTranslation();

  const doneText =
    part.state === "output-available"
      ? (part.output as { correct?: boolean })?.correct
        ? t("toolCall.answerCorrect")
        : t("toolCall.answerWrong")
      : undefined;

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.checkingAnswer"
      doneText={doneText}
      errorKey="toolCall.checkAnswerFailed"
    />
  );
}

export const kind = "tool-checkAnswer";
export const Renderer = CheckAnswerRenderer;
