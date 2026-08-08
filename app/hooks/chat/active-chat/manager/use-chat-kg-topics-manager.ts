import { eq, useLiveQuery, useLiveQueryEffect } from "@tanstack/react-db";
import { keyBy } from "lodash-es";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { KgTopic } from "~/db/db-zod-schema";

import { kgTopicColl, kgEdgeColl, chatKgTopicColl } from "~/db/tdb-collections";
import { initOrama, insertTopic, removeTopic } from "~/lib/similar/orama-index";
import { useKgTopicsStore } from "~/store/kg-topics-store";

const topicDisplayName = (topic: KgTopic, lang: string) => {
  return topic.i18n?.[lang] ?? topic.name;
};

const useChatKgTopicsManager = (chatId: string) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0] ?? i18n.language;

  const { data: allTopics } = useLiveQuery((q) => q.from({ kgTopicColl }));
  const { data: allEdges } = useLiveQuery((q) => q.from({ kgEdgeColl }));

  const setTopics = useKgTopicsStore.use.setTopics();
  const setEdges = useKgTopicsStore.use.setEdges();

  useEffect(() => {
    initOrama(allTopics);
  }, [allTopics]);

  useEffect(() => {
    setTopics(
      (allTopics ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
      })),
    );
  }, [allTopics]);

  useEffect(() => {
    setEdges(
      (allEdges ?? []).map((e) => ({
        prerequisite_id: e.prerequisite_id,
        topic_id: e.topic_id,
        strength: e.strength,
      })),
    );
  }, [allEdges]);

  useLiveQueryEffect<Pick<KgTopic, "id" | "name">>({
    query: (q) =>
      q.from({ kgTopicColl }).select(({ kgTopicColl }) => ({
        id: kgTopicColl.id,
        name: kgTopicColl.name,
      })),
    skipInitial: true,
    onEnter(event, ctx) {
      switch (event.type) {
        case "enter":
          insertTopic(event.value);
          break;
        case "exit":
          removeTopic(event.value.id);
          break;
        case "update":
          insertTopic(event.value);
          break;
      }
    },
  });

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

  // Build adjacency map: topic id → set of neighbor ids (cache to avoid O(n) edge scan)
  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of graphEdges) {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)!.add(edge.target);
      map.get(edge.target)!.add(edge.source);
    }
    return map;
  }, [graphEdges]);

  // Expand to include distance-1 neighbors: chat topics + topics directly connected via edges
  const chatGraphNodeIds = useMemo(() => {
    const expanded = new Set(chatKgTopicsIds);
    for (const id of chatKgTopicsIds) {
      const neighbors = adjacencyMap.get(id);
      if (neighbors) {
        for (const neighbor of neighbors) {
          expanded.add(neighbor);
        }
      }
    }
    return expanded;
  }, [adjacencyMap, chatKgTopicsIds]);

  const chatGraphNodes = useMemo(
    () => graphNodes.filter((it) => chatGraphNodeIds.has(it.id)),
    [graphNodes, chatGraphNodeIds],
  );
  const chatGraphEdges = useMemo(
    () =>
      graphEdges.filter(
        (it) =>
          chatGraphNodeIds.has(it.source) && chatGraphNodeIds.has(it.target),
      ),
    [graphEdges, chatGraphNodeIds],
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
