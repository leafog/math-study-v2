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
  filterSubjects?: string[];
  selectedNodeId?: string;
  onNodeSelect?: (
    node: { id: string; name: string; subject: string } | null,
  ) => void;
}

// ── Component ──

export function KnowledgeGraph({
  nodes,
  edges,
  filterSubjects,
  selectedNodeId,
  onNodeSelect,
}: Readonly<KnowledgeGraphProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clickHandlerRef = useRef(onNodeSelect);
  clickHandlerRef.current = onNodeSelect;

  // ── Build / rebuild graph on data changes ──
  useEffect(() => {
    if (!containerRef.current || !nodes.length) return;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = edges
      .filter((d) => nodeIds.has(d.source) && nodeIds.has(d.target))
      .map((d) => ({ ...d, type: d.type as "prerequisite" | "unlocks" }));
    const nodesCopy: GraphNode[] = nodes.map((d) => ({ ...d }));

    const hasFilter = filterSubjects && filterSubjects.length > 0;

    // ── Simulation ──
    const simulation = d3
      .forceSimulation<GraphNode>(nodesCopy)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(80),
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(0, 0))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

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

    // ── Links ──
    g.append("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) =>
        d.type === "prerequisite" ? "#94a3b8" : "#cbd5e1",
      )
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => (d.type === "prerequisite" ? 1.5 : 1))
      .attr("stroke-dasharray", (d) =>
        d.type === "prerequisite" ? "none" : "4,3",
      );

    // ── Nodes ──
    const nodeGroup = g
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodesCopy)
      .join("g");

    nodeGroup
      .append("circle")
      .attr("r", 7)
      .attr("fill", (d) => color(d.subject))
      .attr("stroke", "transparent")
      .attr("stroke-width", 2.5)
      .attr("opacity", (d) => {
        if (!hasFilter) return 1;
        return filterSubjects!.includes(d.subject) ? 1 : 0.15;
      });

    nodeGroup
      .append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", 18)
      .attr("font-size", 7)
      .attr("fill", "currentColor")
      .attr("opacity", (d) => {
        if (!hasFilter) return 0.85;
        return filterSubjects!.includes(d.subject) ? 0.85 : 0.1;
      });

    nodeGroup.append("title").text((d) => `${d.name} — ${d.subject}`);

    // ── Click (uses ref for latest handler) ──
    nodeGroup.on("click", function (this: SVGGElement, _event: MouseEvent) {
      const d = d3.select<SVGGElement, GraphNode>(this).datum();
      const handler = clickHandlerRef.current;
      if (handler) {
        handler(d.id === selectedNodeId ? null : d);
      }
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
      g.selectAll<SVGLineElement, GraphLink>("line")
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      nodeGroup.attr("transform", (d) => `translate(${d.x!},${d.y!})`);
    });

    container.append(svg.node()!);

    // ── Store container for selection updates ──
    (container as any).__kgSvg__ = svg;
    (container as any).__kgSimulation__ = simulation;

    return () => {
      simulation.stop();
      svg.remove();
      delete (container as any).__kgSvg__;
      delete (container as any).__kgSimulation__;
    };
    // Only rebuild on data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, filterSubjects]);

  // ── Resize: update SVG dimensions without rebuilding ──
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

  // ── Update selected node styling ──
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = (containerRef.current as any).__kgSvg__ as
      d3.Selection<SVGSVGElement, unknown, null, undefined> | undefined;
    if (!svg) return;

    svg
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .attr("r", (d) => (d.id === selectedNodeId ? 10 : 7))
      .attr("stroke", (d) =>
        d.id === selectedNodeId ? "#fff" : "transparent",
      );
  }, [selectedNodeId]);

  return <div ref={containerRef} className="h-full w-full select-none" />;
}
