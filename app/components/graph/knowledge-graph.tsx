import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Graph as G6Graph,
  register,
  ZoomCanvas,
  type Graph,
  type GraphData,
  type NodeData,
} from "@antv/g6";

// ── Types ──

interface GraphNode {
  id: string;
  name: string;
  subject: string;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
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

/** 节点半径随度数增长（对应原版 D3 实现；G6 中 size 是直径） */
function nodeRadius(degree: number): number {
  return Math.max(3, Math.min(8, 3 + degree * 0.5));
}

/** 节点自定义数据 */
interface KgNodeData {
  name: string;
  subject: string;
  degree: number;
}

/** 从 G6 NodeData 里安全读自定义数据（.data 在类型上是 loose Record） */
function dataOf(d: NodeData): KgNodeData {
  return (d.data ?? {}) as unknown as KgNodeData;
}

/** 解析 CSS 变量为具体颜色：G6 画布渲染不认 var()，必须落到实际值 */
function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function buildDegreeMap(
  nodeIds: Set<string>,
  edges: GraphEdge[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const id of nodeIds) map.set(id, 0);
  for (const e of edges) {
    map.set(e.source, (map.get(e.source) ?? 0) + 1);
    map.set(e.target, (map.get(e.target) ?? 0) + 1);
  }
  return map;
}

function buildNeighborMap(
  nodeIds: Set<string>,
  edges: GraphEdge[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const id of nodeIds) map.set(id, new Set());
  for (const e of edges) {
    map.get(e.source)!.add(e.target);
    map.get(e.target)!.add(e.source);
  }
  return map;
}

// ── 自定义缩放行为：限制缩放范围（对应原版 scaleExtent [0.1, 4]）──

class RangeZoomCanvas extends ZoomCanvas {
  override zoom = async (
    value: number,
    event: Parameters<ZoomCanvas["zoom"]>[1],
    animation: Parameters<ZoomCanvas["zoom"]>[2],
  ): Promise<void> => {
    if (!this.validate(event)) return;
    const { graph } = this.context;
    const options = this.options as unknown as {
      origin?: { x: number; y: number };
      sensitivity?: number;
      onFinish?: () => void;
      minZoom?: number;
      maxZoom?: number;
    };

    let origin: [number, number] | undefined = options.origin
      ? [options.origin.x, options.origin.y]
      : undefined;
    const ev = event as { viewport?: { x: number; y: number } };
    if (!origin && ev.viewport) origin = [ev.viewport.x, ev.viewport.y];

    const { sensitivity = 1, onFinish, minZoom = 0.1, maxZoom = 4 } = options;
    const ratio = 1 + (Math.max(-50, Math.min(50, value)) * sensitivity) / 100;
    const next = Math.max(minZoom, Math.min(maxZoom, graph.getZoom() * ratio));
    await graph.zoomTo(next, animation, origin);
    onFinish?.();
  };
}

register("behavior", "zoom-canvas-range", RangeZoomCanvas);

// ── Component ──

export const KnowledgeGraph = forwardRef<
  KnowledgeGraphHandle,
  KnowledgeGraphProps
>(function KnowledgeGraph(
  { nodes, edges, onNodeHover }: Readonly<KnowledgeGraphProps>,
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const hoverHandlerRef = useRef(onNodeHover);
  hoverHandlerRef.current = onNodeHover;

  // 悬浮聚焦依赖的邻接信息（数据更新时同步），初始化 effect 只跑一次所以必须走 ref
  const hoverInfoRef = useRef<{
    neighborMap: Map<string, Set<string>>;
    nodeById: Map<string, GraphNode>;
    nodeIds: string[];
    edges: Array<{ id: string; source: string; target: string }>;
  }>({
    neighborMap: new Map(),
    nodeById: new Map(),
    nodeIds: [],
    edges: [],
  });

  // 只做一次初始 fitView，之后保留用户的平移/缩放（对应原版 d3 zoom 状态持久）
  const fittedRef = useRef(false);

  // 映射为 G6 GraphData：degree 放入 data，尺寸/字体由度数推导
  const model = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    const validEdges = edges.filter(
      (e) => ids.has(e.source) && ids.has(e.target),
    );
    const degreeMap = buildDegreeMap(ids, validEdges);
    const neighborMap = buildNeighborMap(ids, validEdges);
    const edgeIndex = validEdges.map((e) => ({
      id: `${e.source}->${e.target}`,
      source: e.source,
      target: e.target,
      type: e.type,
    }));

    const graphData: GraphData = {
      nodes: nodes.map((n) => ({
        id: n.id,
        data: {
          name: n.name,
          subject: n.subject,
          degree: degreeMap.get(n.id) ?? 0,
        },
      })),
      edges: edgeIndex.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        data: { type: e.type },
      })),
    };

    return {
      graphData,
      hoverInfo: {
        neighborMap,
        nodeById: new Map(nodes.map((n) => [n.id, n] as const)),
        nodeIds: nodes.map((n) => n.id),
        edges: edgeIndex,
      },
    };
  }, [nodes, edges]);

  // ── 初始化：创建图实例一次 ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // G6 画布不认 CSS var()，把主题 token 解析成具体颜色
    const colors = {
      node: cssVar("--muted-foreground", "#64748b"),
      foreground: cssVar("--foreground", "#0f172a"),
      border: cssVar("--border", "#94a3b8"),
      accent: cssVar("--primary", "#2563eb"),
    };

    const graph = new G6Graph({
      container,
      animation: false,
      layout: {
        type: "d3-force",
        // 布局动画开启：按 tick 实时渲染，拖拽节点时力导实时重算（原版 d3 同款观感）
        animation: true,
        link: { distance: 60 },
        manyBody: { strength: -150 },
        center: { x: 0, y: 0 },
        x: { strength: 0.05 },
        y: { strength: 0.05 },
      },
      behaviors: [
        "drag-canvas",
        { type: "zoom-canvas-range", minZoom: 0.1, maxZoom: 4 },
        "drag-element-force",
      ],
      plugins: [
        // {
        //   // 原生 SVG <title> 的 G6 等价物：悬浮显示 "name — subject"
        //   type: "tooltip",
        //   trigger: "hover",
        //   enable: (event: { targetType?: string }) =>
        //     event.targetType === "node",
        //   getContent: (_event: unknown, items: Array<{ data?: unknown }>) => {
        //     const d = (items[0]?.data ?? {}) as Partial<KgNodeData>;
        //     const { name = "", subject = "" } = d;
        //     return subject ? `${name} — ${subject}` : name;
        //   },
        // },
      ],
      node: {
        style: {
          size: (d) => nodeRadius(dataOf(d).degree ?? 0) * 2,
          fill: colors.node,
          stroke: "transparent",
          lineWidth: 2,
          cursor: "pointer",
          // 标签常显（对应原版）
          labelText: (d) => dataOf(d).name ?? "",
          labelPlacement: "bottom",
          labelOffsetY: 6,
          labelFontSize: (d) =>
            Math.max(0, 6 + nodeRadius(dataOf(d).degree ?? 0) * 0.3),
          labelFill: colors.foreground,
          labelOpacity: 0.7,
        },
        state: {
          // 悬浮的节点本身：填充主色（对应原版 mouseenter 逻辑）
          hovered: {
            fill: colors.accent,
          },
          // 非邻居节点变暗
          dim: {
            fillOpacity: 0.12,
            strokeOpacity: 0.12,
            labelOpacity: 0.1,
          },
          // focusNode 脉冲：放大到 2.2 倍 + 主色描边
          pulse: {
            fill: colors.accent,
            stroke: colors.accent,
            strokeOpacity: 0.4,
            lineWidth: 2,
            size: (d) => nodeRadius(dataOf(d).degree ?? 0) * 2 * 2.2,
          },
        },
      },
      edge: {
        style: {
          stroke: colors.border,
          strokeOpacity: 0.45,
          lineWidth: 1,
        },
        state: {
          "link-active": {
            stroke: colors.accent,
            strokeOpacity: 0.6,
          },
          "edge-dim": {
            strokeOpacity: 0.08,
          },
        },
      },
    });

    // ── 悬浮聚焦（对应原版 mouseenter/mouseleave）──
    graph.on("node:pointerover", (event) => {
      const id = (event as unknown as { target?: { id?: string } }).target?.id;
      if (!id) return;
      const { neighborMap, nodeById, nodeIds, edges } = hoverInfoRef.current;
      const neighbors = neighborMap.get(id) ?? new Set();

      const nodeStates: Record<string, string[]> = {};
      for (const nid of nodeIds) {
        if (nid === id) nodeStates[nid] = ["hovered"];
        else nodeStates[nid] = neighbors.has(nid) ? [] : ["dim"];
      }
      const edgeStates: Record<string, string[]> = {};
      for (const e of edges) {
        edgeStates[e.id] =
          e.source === id || e.target === id ? ["link-active"] : ["edge-dim"];
      }

      try {
        graph.setElementState({ ...nodeStates, ...edgeStates }, false);
      } catch {
        // 数据刚更新时旧 id 可能已失效，忽略
      }

      const node = nodeById.get(id);
      if (node) hoverHandlerRef.current?.(node);
    });

    graph.on("node:pointerout", () => {
      const { nodeIds, edges } = hoverInfoRef.current;
      const clear: Record<string, string[]> = {};
      for (const nid of nodeIds) clear[nid] = [];
      for (const e of edges) clear[e.id] = [];
      try {
        graph.setElementState(clear, false);
      } catch {
        // ignore
      }
      hoverHandlerRef.current?.(null);
    });

    graphRef.current = graph;

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, []);

  // ── 数据更新：同步邻接信息，整体替换数据并重渲染（d3-force 重新收敛）──
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    hoverInfoRef.current = model.hoverInfo;
    graph.setData(model.graphData);
    void graph.render().then(() => {
      if (fittedRef.current) return;
      fittedRef.current = true;
      if ((model.graphData.nodes?.length ?? 0) > 0) void graph.fitView();
    });
  }, [model]);

  // ── Imperative API: focus a node by topic ID（原版：放大 1.2 → 居中 → 脉冲两次）──
  useImperativeHandle(
    ref,
    () => ({
      focusNode(topicId: string) {
        const graph = graphRef.current;
        if (!graph) return;
        void (async () => {
          try {
            await graph.zoomTo(1.2, { duration: 0 });
            await graph.focusElement(topicId, { duration: 750 });
          } catch {
            // 节点不存在或尚未渲染
          }
        })();
        void pulseNode(graph, topicId);
      },
    }),
    [],
  );

  return <div ref={containerRef} className="h-full w-full select-none" />;
});

/** 节点脉冲动画：放大到 2.2 倍两次（对应原版 d3 的 pulse） */
async function pulseNode(graph: Graph, id: string) {
  try {
    for (let i = 0; i < 2; i++) {
      await graph.setElementState({ [id]: ["pulse"] }, true);
      await graph.setElementState({ [id]: [] }, true);
    }
  } catch {
    // 节点可能已不存在
  }
}
