import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";

export const CreateTopic = ({
  part,
}: ToolRendererProps<"tool-createTopic">) => {
  const { t } = useTranslation();

  const doneText =
    part.state === "output-available"
      ? part.output.success
        ? t("toolCall.topicRecorded")
        : t("toolCall.topicLinked")
      : undefined;

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.recordingTopic"
      doneText={doneText}
      errorKey="toolCall.recordTopicFailed"
    />
  );
};
