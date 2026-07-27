import { memo, useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { kgTopicColl, kgEdgeColl } from "~/db/tdb-collections";
import type { KgTopic } from "~/db/db-zod-schema";

function topicDisplayName(topic: KgTopic, lang: string): string {
  return topic.i18n?.[lang] ?? topic.name;
}

const KnowledgeGraphAll = () => {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0] ?? i18n.language;

  const { data: allTopics } = useLiveQuery((q) => q.from({ kgTopicColl }));

  const { data: allEdges } = useLiveQuery((q) => q.from({ kgEdgeColl }));

  const topicIds = useMemo(
    () => new Set(allTopics?.map((t) => t.id) ?? []),
    [allTopics],
  );

  const graphNodes = useMemo(
    () =>
      (allTopics ?? []).map((t) => ({
        id: t.id,
        name: topicDisplayName(t, lang),
        subject: t.subject,
      })),
    [allTopics, lang],
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

export default memo(KnowledgeGraphAll);
