import * as d3 from "d3";
import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// ── Types ──
interface GraphNode extends SimulationNodeDatum {
  id: string;
  name: string;
  subject: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  type: "prerequisite" | "unlocks";
}

interface KnowledgeGraphProps {
  nodes: Array<{ id: string; name: string; subject: string }>;
  edges: Array<{ source: string; target: string; type: string }>;
  onNodeHover?: (
    node: { id: string; name: string; subject: string } | null,
  ) => void;
}

export interface KnowledgeGraphHandle {
  focusNode: (topicId: string) => void;
}

// ── Helpers ──

function nodeRadius(degree: number): number {
  return Math.max(3, Math.min(8, 3 + degree * 0.5));
}

function linkEndpointId(endpoint: string | number | { id: string }): string {
  return typeof endpoint === "object" ? endpoint.id : String(endpoint);
}

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

export const KnowledgeGraph = forwardRef<
  KnowledgeGraphHandle,
  KnowledgeGraphProps
>(function KnowledgeGraph(
  { nodes, edges, onNodeHover }: Readonly<KnowledgeGraphProps>,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverHandlerRef = useRef(onNodeHover);
  hoverHandlerRef.current = onNodeHover;

  // Persistent D3 infrastructure (created once, updated on data change)
  const svgSelRef =
    useRef<d3.Selection<SVGSVGElement, undefined, null, undefined>>(null);
  const gRef =
    useRef<d3.Selection<SVGGElement, undefined, null, undefined>>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink>>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, undefined>>(null);

  // Imperative-access selections (rebound each data update)
  const circlesRef =
    useRef<d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>>(
      null,
    );
  const linkElsRef =
    useRef<d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown>>(null);

  // Fast lookup for focusNode
  const nodeIndexRef = useRef<Map<string, GraphNode>>(new Map());
  const neighborMapRef = useRef<Map<string, Set<string>>>(null);

  // ── Init: create SVG + zoom + simulation once ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    const svg = d3
      .create("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("viewBox", [-w / 2, -h / 2, w, h])
      .attr("style", "max-width: 100%; height: auto;");

    const g = svg.append("g");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, undefined>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, undefined>) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoomBehavior);

    // Empty containers, populated later by the data effect
    g.append("g").attr("class", "links");
    g.append("g").attr("class", "nodes");

    const simulation = d3
      .forceSimulation<GraphNode>([])
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>([])
          .id((d) => d.id)
          .distance(60),
      )
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(0, 0))
      .force("x", d3.forceX().strength(0.05))
      .force("y", d3.forceY().strength(0.05))
      .stop();

    container.append(svg.node()!);

    svgSelRef.current = svg;
    gRef.current = g;
    zoomRef.current = zoomBehavior;
    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      svg.remove();
      svgSelRef.current = null;
      gRef.current = null;
      zoomRef.current = null;
      simulationRef.current = null;
      circlesRef.current = null;
      linkElsRef.current = null;
      nodeIndexRef.current.clear();
    };
  }, []);

  // ── Data: enter/update/exit nodes & edges ──
  useEffect(() => {
    const simulation = simulationRef.current;
    const g = gRef.current;
    if (!simulation || !g) return;

    // ── Build data maps ──
    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = edges
      .filter((d) => nodeIds.has(d.source) && nodeIds.has(d.target))
      .map((d) => ({ ...d, type: d.type as "prerequisite" | "unlocks" }));
    const nodesCopy: GraphNode[] = nodes.map((d) => ({ ...d }));

    const degreeMap = buildDegreeMap(nodeIds, links);
    const neighborMap = buildNeighborMap(nodeIds, links);
    neighborMapRef.current = neighborMap;

    // Update node index for O(1) imperative lookup
    const nodeIndex = nodeIndexRef.current;
    nodeIndex.clear();
    for (const n of nodesCopy) nodeIndex.set(n.id, n);

    // ── Clear existing tick handler before rebinding ──
    simulation.on("tick", null).stop();

    // ── Empty graph: clear containers ──
    const linkContainer = g.select<SVGGElement>(".links")!;
    const nodeContainer = g.select<SVGGElement>(".nodes")!;

    if (!nodes.length) {
      linkContainer.selectAll("line").remove();
      nodeContainer.selectAll("g").remove();
      circlesRef.current = null;
      linkElsRef.current = null;
      return;
    }

    // ── Join links (keyed by source-target pair) ──
    const linkEls = linkContainer
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(
        links,
        (d) => `${linkEndpointId(d.source)}-${linkEndpointId(d.target)}`,
      )
      .join("line")
      .attr("stroke", "var(--border)")
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1);

    // ── Join node groups (keyed by id, preserves children) ──
    const nodeGroups = nodeContainer
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodesCopy, (d) => d.id)
      .join("g");

    // Setup circles + labels + tooltips for entering nodes only
    nodeGroups.each(function (d) {
      const sel = d3.select(this);
      if (sel.select("circle").size()) return; // already initialized
      sel
        .append("circle")
        .attr("r", nodeRadius(degreeMap.get(d.id) ?? 0))
        .attr("fill", "var(--muted-foreground)")
        .attr("stroke", "transparent")
        .attr("stroke-width", 2)
        .attr("style", "cursor: pointer");
      sel
        .append("text")
        .text(d.name)
        .attr("text-anchor", "middle")
        .attr("dy", nodeRadius(degreeMap.get(d.id) ?? 0) + 10)
        .attr(
          "font-size",
          Math.max(0, 6 + nodeRadius(degreeMap.get(d.id) ?? 0) * 0.3),
        )
        .attr("fill", "var(--foreground)")
        .attr("opacity", 0.7)
        .attr("pointer-events", "none");
      sel.append("title").text(`${d.name} — ${d.subject}`);
    });

    // Update text & title on every data change (e.g. language switch)
    nodeGroups.select("text").text((d) => d.name);
    nodeGroups.select("title").text((d) => `${d.name} — ${d.subject}`);

    // Flat circle selection (for tick, hover, imperative API)
    const circles = nodeGroups.select<SVGCircleElement>("circle");

    // ── Tick ──
    simulation.on("tick", () => {
      linkEls
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);
      nodeGroups.attr("transform", (d) => `translate(${d.x!},${d.y!})`);
    });

    // ── Hover: focus mode ──
    nodeGroups
      .on("mouseenter", function (this: SVGGElement) {
        const hovered = d3.select<SVGGElement, GraphNode>(this).datum();
        const neighbors = neighborMap.get(hovered.id) ?? new Set();
        const neighborIds = new Set([hovered.id, ...neighbors]);

        circles
          .attr("opacity", (d) => (neighborIds.has(d.id) ? 1 : 0.12))
          .attr("fill", (d) =>
            d.id === hovered.id ? "var(--primary)" : "var(--muted-foreground)",
          );

        nodeGroups
          .selectAll<SVGTextElement, GraphNode>("text")
          .attr("opacity", (d) => (neighborIds.has(d.id) ? 0.7 : 0.1));

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

        hoverHandlerRef.current?.(hovered);
      })
      .on("mouseleave", function () {
        circles.attr("opacity", 1).attr("fill", "var(--muted-foreground)");
        nodeGroups
          .selectAll<SVGTextElement, GraphNode>("text")
          .attr("opacity", 0.7);
        linkEls.attr("stroke", "var(--border)").attr("stroke-opacity", 0.45);
        hoverHandlerRef.current?.(null);
      });

    // ── Drag ──
    nodeGroups.call(
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

    // ── Update simulation data & restart ──
    simulation.nodes(nodesCopy);
    (simulation.force("link") as d3.ForceLink<GraphNode, GraphLink>).links(
      links,
    );
    simulation.alpha(1).restart();

    // Store selections for imperative access
    circlesRef.current = circles;
    linkElsRef.current = linkEls;
  }, [nodes, edges]);

  // ── Resize (throttled via rAF) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const svg = svgSelRef.current;
        if (!svg || !container) return;
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        svg
          .attr("width", w)
          .attr("height", h)
          .attr("viewBox", [-w / 2, -h / 2, w, h]);
      });
    });

    observer.observe(container);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  // ── Imperative API: focus a node by topic ID ──
  useImperativeHandle(
    ref,
    () => ({
      focusNode(topicId: string) {
        const svg = svgSelRef.current;
        const zoom = zoomRef.current;
        const circles = circlesRef.current;
        if (!svg || !zoom || !circles) return;

        // O(1) lookup via index
        const nodeData = nodeIndexRef.current.get(topicId);
        if (!nodeData || nodeData.x == null || nodeData.y == null) return;

        // viewBox is [-w/2, -h/2, w, h], so (0,0) = screen center
        const scale = 1.2;
        const transform = d3.zoomIdentity
          .translate(-nodeData.x * scale, -nodeData.y * scale)
          .scale(scale);

        svg.transition().duration(750).call(zoom.transform, transform);

        const targetCircle = circles.filter((d) => d.id === topicId);
        if (targetCircle.empty()) return;

        const origR = Number.parseFloat(targetCircle.attr("r"));
        targetCircle.interrupt();

        let count = 0;
        const maxPulses = 2;

        function doPulse() {
          if (count >= maxPulses) {
            targetCircle!
              .transition()
              .duration(300)
              .attr("r", origR)
              .attr("fill", "var(--muted-foreground)")
              .attr("stroke", "transparent");
            return;
          }
          targetCircle!
            .attr("fill", "var(--primary)")
            .attr("stroke", "var(--primary)")
            .attr("stroke-opacity", 0.4)
            .transition()
            .duration(400)
            .attr("r", origR * 2.2)
            .transition()
            .duration(400)
            .attr("r", origR)
            .on("end", () => {
              count++;
              doPulse();
            });
        }

        doPulse();
      },
    }),
    [],
  );

  return <div ref={containerRef} className="h-full w-full select-none" />;
});
