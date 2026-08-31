import { useChatKgTopics } from "~/hooks/chat/active-chat";
import { useTranslation } from "react-i18next";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Button } from "../ui/button";
import { bus } from "~/event/events";
import { useLocation } from "react-router";

const KgTopicInChatItem = ({ id }: { id: string }) => {
  const { pathname } = useLocation();
  const isInChat = pathname.startsWith("/chat");

  const { t } = useTranslation();
  const { getKgTopicById, kgTopicDisplayName } = useChatKgTopics();
  const kgTopic = getKgTopicById(id);
  if (kgTopic === undefined) {
    return;
  }
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button size="sm" variant="ghost">
          {kgTopicDisplayName(kgTopic)}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        className=" flex flex-col gap-0.5 w-fit min-w-32 p-1"
        align="start"
      >
        {isInChat && (
          <Button
            size="xs"
            variant="ghost"
            className="justify-start w-full"
            onClick={(e) => {
              bus.emit("topic:in-chat-view-topic", id);
            }}
          >
            {t("graph.viewKnowledgeGraph")}
          </Button>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default KgTopicInChatItem;
