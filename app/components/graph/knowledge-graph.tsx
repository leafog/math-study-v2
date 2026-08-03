import * as d3 from "d3";
import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";
import { useEffect, useRef } from "react";

// ── Types ──
interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  subject: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  type: "prerequisite" | "unlocks";
}

// ── Props ──

interface KnowledgeGraphProps {
  nodes: Array<{ id: string; name: string; subject: string }>;
  edges: Array<{ source: string; target: string; type: string }>;
  onNodeHover?: (
    node: { id: string; name: string; subject: string } | null,
  ) => void;
}

// ── Obsidian-style helpers ──

/** Node radius based on connection count (3–8px, Obsidian-like) */
function nodeRadius(degree: number): number {
  return Math.max(3, Math.min(8, 3 + degree * 0.5));
}

/** Resolve link endpoint to a string id (handles pre/post-simulation types) */
function linkEndpointId(endpoint: string | number | { id: string }): string {
  return typeof endpoint === "object" ? endpoint.id : String(endpoint);
}

/** Build degree map from links */
function buildDegreeMap(
  nodeIds: Set<string>,
  links: GraphLink[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of nodeIds) map.set(id, 0);
  for (const l of links) {
    const s = linkEndpointId(l.source);
    const t = linkEndpointId(l.target);
    map.set(s, (map.get(s) ?? 0) + 1);
    map.set(t, (map.get(t) ?? 0) + 1);
  }
  return map;
}

/** Build neighbor set for each node (for hover focus mode) */
function buildNeighborMap(
  nodeIds: Set<string>,
  links: GraphLink[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const id of nodeIds) map.set(id, new Set());
  for (const l of links) {
    const s = linkEndpointId(l.source);
    const t = linkEndpointId(l.target);
    map.get(s)!.add(t);
    map.get(t)!.add(s);
  }
  return map;
}

// ── Component ──

export function KnowledgeGraph({
  nodes,
  edges,
  onNodeHover,
}: Readonly<KnowledgeGraphProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverHandlerRef = useRef(onNodeHover);
  hoverHandlerRef.current = onNodeHover;

  // ── Build / rebuild graph on data changes ──
  useEffect(() => {
    if (!containerRef.current || !nodes.length) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = edges
      .filter((d) => nodeIds.has(d.source) && nodeIds.has(d.target))
      .map((d) => ({ ...d, type: d.type as "prerequisite" | "unlocks" }));
    const nodesCopy: GraphNode[] = nodes.map((d) => ({ ...d }));

    const degreeMap = buildDegreeMap(nodeIds, links);
    const neighborMap = buildNeighborMap(nodeIds, links);

    // ── Simulation (Obsidian: strong charge, moderate link distance) ──
    const simulation = d3
      .forceSimulation<GraphNode>(nodesCopy)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(0, 0))
      .force("x", d3.forceX().strength(0.05))
      .force("y", d3.forceY().strength(0.05));

    // ── SVG ──
    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // ── Zoom ──
    const g = svg.append("g");
    svg.call(
      d3
        .zoom<SVGSVGElement, undefined>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, undefined>) => {
          g.attr("transform", event.transform.toString());
        }),
    );

    // ── Links (Obsidian: very thin, very subtle) ──
    const linkGroup = g.append("g");
    const linkEls = linkGroup
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", "var(--border)")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1);

    // ── Nodes ──
    const nodeGroup = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodesCopy)
      .join("g");

    // Circles
    const circles = nodeGroup
      .append("circle")
      .attr("r", (d) => nodeRadius(degreeMap.get(d.id) ?? 0))
      .attr("fill", "var(--muted-foreground)")
      .attr("stroke", "transparent")
      .attr("stroke-width", 2)
      .attr("style", "cursor: pointer");

    // Labels (always visible)
    nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", (d) => nodeRadius(degreeMap.get(d.id) ?? 0) + 10)
      .attr("font-size", (d) =>
        Math.max(0, 6 + nodeRadius(degreeMap.get(d.id) ?? 0) * 0.3),
      )
      .attr("fill", "var(--foreground)")
      .attr("opacity", 0.7)
      .attr("pointer-events", "none");

    // Tooltips (fallback for title attribute)
    nodeGroup.append("title").text((d) => `${d.name} — ${d.subject}`);

    // ── Hover: Obsidian focus mode ──
    nodeGroup
      .on("mouseenter", function (this: SVGGElement) {
        const hovered = d3.select<SVGGElement, GraphNode>(this).datum();
        const neighbors = neighborMap.get(hovered.id) ?? new Set();
        const neighborIds = new Set([hovered.id, ...neighbors]);

        // Dim all nodes except hovered + neighbors
        circles
          .attr("opacity", (d) => (neighborIds.has(d.id) ? 1 : 0.12))
          .attr("fill", (d) =>
            d.id === hovered.id ? "var(--primary)" : "var(--muted-foreground)",
          );

        // Highlight connected links with primary color
        linkEls
          .attr("stroke", (d) => {
            const s = linkEndpointId(d.source);
            const t = linkEndpointId(d.target);
            return s === hovered.id || t === hovered.id
              ? "var(--primary)"
              : "var(--border)";
          })
          .attr("stroke-opacity", (d) => {
            const s = linkEndpointId(d.source);
            const t = linkEndpointId(d.target);
            return s === hovered.id || t === hovered.id ? 0.6 : 0.08;
          });

        const handler = hoverHandlerRef.current;
        if (handler) handler(hovered);
      })
      .on("mouseleave", function () {
        // Reset all
        circles.attr("opacity", 1).attr("fill", "var(--muted-foreground)");
        linkEls.attr("stroke", "var(--border)").attr("stroke-opacity", 0.45);

        const handler = hoverHandlerRef.current;
        if (handler) handler(null);
      });

    // ── Drag ──
    nodeGroup.call(
      d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (_event, d) => {
          if (!simulation.alphaTarget()) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    // ── Tick ──
    simulation.on("tick", () => {
      linkEls
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      nodeGroup.attr("transform", (d) => `translate(${d.x!},${d.y!})`);
    });

    container.append(svg.node()!);

    // ── Store for resize ──
    (container as any).__kgSvg__ = svg;
    (container as any).__kgSimulation__ = simulation;

    return () => {
      simulation.stop();
      svg.remove();
      delete (container as any).__kgSvg__;
      delete (container as any).__kgSimulation__;
    };
  }, [nodes, edges]);

  // ── Resize ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const svg = (container as any).__kgSvg__ as
        d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
      if (!svg) return;

      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;

      svg
        .attr("width", w)
        .attr("height", h)
        .attr("viewBox", [-w / 2, -h / 2, w, h]);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef} className="h-full w-full select-none" />;
}
