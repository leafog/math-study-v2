import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";

export const CheckAnswer = ({ part }: ToolRendererProps<"tool-checkAnswer">) => {
  const { t } = useTranslation();

  const doneText =
    part.state === "output-available"
      ? part.output.correct
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
};
