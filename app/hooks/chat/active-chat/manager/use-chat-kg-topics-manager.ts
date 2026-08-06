import { eq, useLiveQuery } from "@tanstack/react-db";
import { keyBy } from "lodash-es";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { KgTopic } from "~/db/db-zod-schema";

import { kgTopicColl, kgEdgeColl, chatKgTopicColl } from "~/db/tdb-collections";

const topicDisplayName = (topic: KgTopic, lang: string) => {
  return topic.i18n?.[lang] ?? topic.name;
};

const useChatKgTopicsManager = (chatId: string) => {
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

  const { data: chatKgTopics } = useLiveQuery(
    (q) =>
      q
        .from({ chatKgTopicColl })
        .where(({ chatKgTopicColl }) => eq(chatKgTopicColl.chat_id, chatId)),
    [chatId],
  );

  const chatKgTopicsIds = useMemo(
    () => new Set(chatKgTopics.map((it) => it.topic_id)),
    [chatKgTopics],
  );

  const chatGraphNodes = useMemo(
    () => graphNodes.filter((it) => chatKgTopicsIds.has(it.id)),
    [graphNodes, chatKgTopicsIds],
  );
  const chatGraphEdges = useMemo(
    () =>
      graphEdges.filter(
        (it) =>
          chatKgTopicsIds.has(it.source) && chatKgTopicsIds.has(it.target),
      ),
    [graphEdges, chatKgTopicsIds],
  );
  const kgTopicsMap = useMemo(
    () => keyBy(allTopics, (it) => it.id),
    [allTopics],
  );
  const kgTopicDisplayName = (kgTopic: KgTopic) => {
    return topicDisplayName(kgTopic, lang);
  };
  const getKgTopicById = (id: string | undefined): KgTopic | undefined => {
    return id ? kgTopicsMap[id] : undefined;
  };

  return {
    graphNodes,
    graphEdges,
    chatGraphNodes,
    chatGraphEdges,
    kgTopicsMap,
    kgTopicDisplayName,
    getKgTopicById,
  };
};

export default useChatKgTopicsManager;
