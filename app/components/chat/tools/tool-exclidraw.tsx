import { useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Pen } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ToolDefinition } from "./types";

const Panel = () => {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);

  return (
    <div className="size-full">
      <Excalidraw
        gridModeEnabled
        excalidrawAPI={(api) => {
          apiRef.current = api;
        }}
      />
    </div>
  );
};

const exclidrawTool: ToolDefinition = {
  kind: "excalidraw",
  Icon: Pen,
  Panel,
};

export default exclidrawTool;
