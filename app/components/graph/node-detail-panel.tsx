import { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";
import { getSubjectColor } from "~/data/curriculum-mock";
import type { CurriculumNode, CurriculumEdge } from "~/data/curriculum-mock";

interface NodeDetailPanelProps {
  node: CurriculumNode;
  edges: CurriculumEdge[];
  allNodes: CurriculumNode[];
  onClose: () => void;
}

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onClose,
}: Readonly<NodeDetailPanelProps>) {
  const nodeMap = useMemo(
    () => new Map(allNodes.map((n) => [n.id, n])),
    [allNodes],
  );

  const prerequisites = useMemo(
    () =>
      edges
        .filter((e) => e.target === node.id)
        .map((e) => nodeMap.get(e.source))
        .filter(Boolean) as CurriculumNode[],
    [edges, node.id, nodeMap],
  );

  const unlocks = useMemo(
    () =>
      edges
        .filter((e) => e.source === node.id)
        .map((e) => nodeMap.get(e.target))
        .filter(Boolean) as CurriculumNode[],
    [edges, node.id, nodeMap],
  );

  return (
    <div className="h-full flex flex-col bg-background border-l border-border shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: getSubjectColor(node.subject) }}
          />
          <h3 className="font-semibold text-sm truncate">{node.name}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="shrink-0"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4 py-3">
        {/* Subject & difficulty */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">
            {node.subject}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {"★".repeat(node.difficulty ?? 1)}
          </Badge>
        </div>

        {/* Description */}
        {node.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {node.description}
          </p>
        )}

        {/* Prerequisites */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            前置知识 · {prerequisites.length}
          </h4>
          {prerequisites.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">无前置要求</p>
          ) : (
            <ul className="space-y-1">
              {prerequisites.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-accent"
                >
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: getSubjectColor(p.subject) }}
                  />
                  <span className="truncate">{p.name}</span>
                  <Badge variant="ghost" className="text-[10px] ml-auto">
                    {p.subject}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Unlocks */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            后续知识 · {unlocks.length}
          </h4>
          {unlocks.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">无后续知识</p>
          ) : (
            <ul className="space-y-1">
              {unlocks.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-accent"
                >
                  <div
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: getSubjectColor(u.subject) }}
                  />
                  <span className="truncate">{u.name}</span>
                  <Badge variant="ghost" className="text-[10px] ml-auto">
                    {u.subject}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
