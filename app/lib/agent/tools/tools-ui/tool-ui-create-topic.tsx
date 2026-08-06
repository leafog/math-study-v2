import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";
import { useChatKgTopics } from "~/hooks/chat/active-chat";
import KgTopicItem from "~/components/graph/kg-topic-in-chat-item";

export const CreateTopic = ({
  part,
}: ToolRendererProps<"tool-createTopic">) => {
  const { t } = useTranslation();
  const topicId = part.output?.topic_id;

  const doneText =
    part.state === "output-available"
      ? part.output.success
        ? t("toolCall.topicRecorded")
        : t("toolCall.topicLinked")
      : undefined;

  return (
    <div className="flex flex-row gap-2 items-center">
      <ToolCallLabel
        state={part.state}
        loadingKey="toolCall.recordingTopic"
        doneText={doneText}
        errorKey="toolCall.recordTopicFailed"
      />
      {topicId && <KgTopicItem id={topicId} />}
    </div>
  );
};
