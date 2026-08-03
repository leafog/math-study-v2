import { useEffect, useMemo } from "react";
import { useLiveQuery, useLiveSuspenseQuery, eq } from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { useActiveChat } from "~/hooks/chat/active-chat";
import {
  conversationKgTopicColl,
  kgTopicColl,
  kgEdgeColl,
} from "~/db/tdb-collections";
import type { KgTopic } from "~/db/db-zod-schema";

function topicDisplayName(topic: KgTopic, lang: string): string {
  return topic.i18n?.[lang] ?? topic.name;
}

const ChatKnowledgeGraph = () => {
  const { chatId } = useActiveChat();
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0] ?? i18n.language;

  const { data: relations } = useLiveQuery(
    (q) =>
      q
        .from({ conversationKgTopicColl })
        .where(({ conversationKgTopicColl }) =>
          eq(conversationKgTopicColl.conversation_id, chatId),
        ),
    [chatId],
  );

  const { data: allTopics } = useLiveQuery((q) => q.from({ kgTopicColl }));

  const { data: allEdges } = useLiveQuery((q) => q.from({ kgEdgeColl }));

  const topicIds = useMemo(
    () => new Set(relations?.map((r) => r.topic_id) ?? []),
    [relations],
  );

  const graphNodes = useMemo(
    () =>
      (allTopics ?? [])
        .filter((t) => topicIds.has(t.id))
        .map((t) => ({
          id: t.id,
          name: topicDisplayName(t, lang),
          subject: t.subject,
        })),
    [allTopics, topicIds, lang],
  );

  const graphEdges = useMemo(
    () =>
      (allEdges ?? [])
        .filter(
          (e) => topicIds.has(e.prerequisite_id) && topicIds.has(e.topic_id),
        )
        .map((e) => ({
          source: e.prerequisite_id,
          target: e.topic_id,
          type: (e.strength === "hard" ? "prerequisite" : "unlocks") as
            "prerequisite" | "unlocks",
        })),
    [allEdges, topicIds],
  );

  if (graphNodes.length === 0) {
    return null;
  }

  return <KnowledgeGraph nodes={graphNodes} edges={graphEdges} />;
};

export default ChatKnowledgeGraph;
