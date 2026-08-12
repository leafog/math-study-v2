import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { useChatKgTopics } from "~/hooks/chat/active-chat";
import KgTopicItem from "~/components/graph/kg-topic-in-chat-item";
import { ToolInline } from "./_tool-common";

export const CreateTopic = ({
  part,
}: ToolRendererProps<"tool-createTopic">) => {
  const { t } = useTranslation();
  const topicId = part.output?.topic_id;

  return (
    <ToolInline title={t("toolCall.title.createTopic")} part={part}>
      {topicId && <KgTopicItem id={topicId} />}
    </ToolInline>
  );
};
