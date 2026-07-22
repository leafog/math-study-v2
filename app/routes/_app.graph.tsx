import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink } from "lucide-react";
import { KnowledgeGraph } from "~/components/graph/knowledge-graph";
import { NodeDetailPanel } from "~/components/graph/node-detail-panel";
import { getSubjectColor } from "~/data/curriculum-mock";
import { Badge } from "~/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useLiveSuspenseQuery } from "@tanstack/react-db";
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
  const { data: topics } = useLiveSuspenseQuery((q) => q.from({ kgTopicColl }));
  const { data: edges } = useLiveSuspenseQuery((q) => q.from({ kgEdgeColl }));

  const { t, i18n } = useTranslation();
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
      <div className="absolute inset-0">
        <KnowledgeGraph
          nodes={filteredNodes}
          edges={graphEdges}
          filterSubjects={
            filterSubjects.length > 0 ? filterSubjects : undefined
          }
          selectedNodeId={selectedNode?.id}
          onNodeSelect={handleNodeSelect}
        />
      </div>

      {/* Overlaid UI */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 pointer-events-none">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 shrink-0 pointer-events-auto">
          <h1 className="text-xl font-bold tracking-tight">
            {t("graph.title", "Everything You Learn")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("graph.subtitle", "Mathematics knowledge graph")}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {stats.nodes} {t("graph.concepts", "concepts")}
            {" & "}
            {stats.edges} {t("graph.links", "prerequisite links")}
          </p>
        </div>

        {/* Subject filters */}
        <div className="px-6 pb-3 flex items-center gap-2 flex-wrap shrink-0 pointer-events-auto">
          <span className="text-xs text-muted-foreground mr-1">
            {t("graph.subjects", "Subjects")} ·
          </span>
          {subjects.map((subject) => {
            const active = filterSubjects.includes(subject);
            return (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className="focus:outline-none"
              >
                <Badge
                  variant={active ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-all"
                  style={
                    active
                      ? { backgroundColor: getSubjectColor(subject) }
                      : undefined
                  }
                >
                  {subject}
                </Badge>
              </button>
            );
          })}
          {filterSubjects.length > 0 && (
            <button
              onClick={() => setFilterSubjects([])}
              className="text-xs text-muted-foreground hover:text-foreground ml-1"
            >
              {t("graph.clear", "Clear")}
            </button>
          )}
        </div>

        {/* Spacer - graph shows through here */}
        <div className="flex-1 min-h-0" />

        {/* Footer attribution */}
        <div className="px-6 pb-3 flex items-center gap-3 text-xs text-muted-foreground/50 shrink-0 pointer-events-auto">
          <span>{t("graph.dataSource", "Built from curriculum data")}</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground/70 transition-colors"
          >
            <ExternalLink size={10} />
            {t("graph.viewOnGitHub", "View on GitHub")}
          </a>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            key="detail-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="border-l border-border overflow-hidden shrink-0"
          >
            <div className="w-70 h-full">
              <NodeDetailPanel
                node={selectedNode}
                edges={graphEdges}
                allNodes={graphNodes}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Graph;
