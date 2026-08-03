import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolMessageRendererProps } from "./types";

function CreateTopicRenderer({ part }: ToolMessageRendererProps) {
  const { t } = useTranslation();

  const doneText =
    part.state === "output-available"
      ? (part.output as { created?: boolean })?.created
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
}

export const kind = "tool-createTopic";
export const Renderer = CreateTopicRenderer;
