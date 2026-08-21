import { useRef, useEffect } from "react";

import { ChartScatter } from "lucide-react";

import type { ToolPanelProps } from "./types";

import FunctionGraph from "~/components/math/jsx-graph/function-graph";
const JsxGraphPanel = ({}: ToolPanelProps) => {
  const keyboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = keyboardRef.current;
    if (!container) return;
    window.mathVirtualKeyboard.container = container;
    window.mathVirtualKeyboard.visible = false;
  }, []);

  return (
    <div className="flex-1 min-h-0 bg-red-50">
      <FunctionGraph />
      <div
        className="absolute bottom-0  h-fit bg-red-100 w-full"
        ref={keyboardRef}
      ></div>
    </div>
  );
};

export default JsxGraphPanel;
