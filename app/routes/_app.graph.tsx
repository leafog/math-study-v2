import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { NodeDetailPanel } from "~/components/graph/node-detail-panel";
import { getSubjectColor } from "~/data/curriculum-mock";
import { Badge } from "~/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useLiveQuery, useLiveSuspenseQuery } from "@tanstack/react-db";
import { kgTopicColl, kgEdgeColl } from "~/db/tdb-collections";
import type { KgTopic, KgEdge } from "~/db/db-zod-schema";

type GraphNode = {
  id: string;
  name: string;
  subject: string;
  description?: string;
};

function localName(topic: KgTopic, lang: string): string {
  return topic.i18n?.[lang] ?? topic.name;
}

function localDescription(topic: KgTopic, lang: string): string {
  return topic.description_i18n?.[lang] ?? topic.description;
}

const Graph = () => {
  const { data: topics } = useLiveQuery((q) => q.from({ kgTopicColl }));
  const { data: edges } = useLiveQuery((q) => q.from({ kgEdgeColl }));

  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0] ?? i18n.language;
  const [filterSubjects, setFilterSubjects] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const toggleSubject = (subject: string) => {
    setFilterSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    );
  };

  const handleNodeSelect = useCallback(
    (node: { id: string; name: string; subject: string } | null) => {
      setSelectedNode((prev) => (node?.id === prev?.id ? null : node));
    },
    [],
  );

  const graphNodes: GraphNode[] = useMemo(
    () =>
      (topics ?? []).map((topic: KgTopic) => ({
        id: topic.id,
        name: localName(topic, lang),
        subject: topic.subject,
        description: localDescription(topic, lang),
      })),
    [topics, lang],
  );

  const graphEdges = useMemo(
    () =>
      (edges ?? []).map((e: KgEdge) => ({
        source: e.prerequisite_id,
        target: e.topic_id,
        type: (e.strength === "hard" ? "prerequisite" : "unlocks") as
          "prerequisite" | "unlocks",
      })),
    [edges],
  );

  const subjects = useMemo(
    () => [...new Set(graphNodes.map((n) => n.subject))],
    [graphNodes],
  );

  const stats = useMemo(
    () => ({
      nodes: graphNodes.length,
      edges: graphEdges.length,
    }),
    [graphNodes, graphEdges],
  );

  const filteredNodes = useMemo(
    () =>
      filterSubjects.length === 0
        ? graphNodes
        : graphNodes.filter((n) => filterSubjects.includes(n.subject)),
    [graphNodes, filterSubjects],
  );
  useEffect(() => {
    console.log(topics);
  }, [topics]);

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Graph - full background */}
      <div className="absolute inset-0 bg-red-50 ">
        <KnowledgeGraph
          nodes={filteredNodes}
          edges={graphEdges}
          selectedNodeId={selectedNode?.id}
          onNodeSelect={handleNodeSelect}
        />
      </div>
    </div>
  );
};

export default Graph;
