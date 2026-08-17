import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import KgTopicInChatItem from "~/components/graph/kg-topic-in-chat-item";
import { ToolInline } from "./_tool-common";

export const LinkTopics = ({ part }: ToolRendererProps<"tool-linkTopics">) => {
  const { t } = useTranslation();
  const topicIds = part.output?.linked;

  return (
    <ToolInline title={t("toolCall.title.linkTopics")} part={part}>
      {topicIds && topicIds.length > 0 && (
        <div className="flex flex-row flex-wrap gap-1">
          {topicIds.slice(0, 3).map((id) => (
            <KgTopicInChatItem key={id} id={id} />
          ))}
        </div>
      )}
    </ToolInline>
  );
};
