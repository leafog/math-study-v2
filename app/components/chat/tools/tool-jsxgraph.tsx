import { useRef, useEffect } from "react";

import { ChartScatter } from "lucide-react";
import { JSXGraph } from "jsxgraph";
import type { ToolDefinition } from "./types";

const Panel = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/jsxgraph.css";
    document.head.appendChild(link);

    const container = containerRef.current;
    if (!container) return;

    const board = JSXGraph.initBoard(container, {
      boundingbox: [-5, 5, 5, -5],
      axis: true,
      grid: true,
      showCopyright: false,
      showNavigation: false,
    });

    return () => {
      JSXGraph.freeBoard(board);
      document.head.removeChild(link);
    };
  }, []);

  return <div ref={containerRef} className="size-full" />;
};

const jsxgraphTool: ToolDefinition = {
  kind: "jsxgraph",
  Icon: ChartScatter,
  Panel,
};

export default jsxgraphTool;
