import { useRef, useEffect } from "react";

import { ChartScatter } from "lucide-react";
import { JSXGraph } from "jsxgraph";
import type { ToolDefinition, ToolPanelProps } from "./types";

const Panel = ({}: ToolPanelProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/jsxgraph.css";
    document.head.appendChild(link);
    const container = containerRef.current;
    if (!container) return;

    const board = JSXGraph.initBoard(container, {
      axis: true,
      grid: true,
      showCopyright: false,
      showNavigation: true,
      keepAspectRatio: true, // 保持横纵轴单位长度比例不变
    });

    return () => {
      JSXGraph.freeBoard(board);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div className="flex-1 min-h-0">
      <div
        ref={containerRef}
        className="aspect-square border mx-auto h-1/2"
      ></div>
    </div>
  );
};

const jsxgraphTool: ToolDefinition = {
  kind: "jsxgraph",
  Icon: ChartScatter,
  Panel,
};

export default jsxgraphTool;
