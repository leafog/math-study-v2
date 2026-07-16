import { useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Pen } from "lucide-react";
import ToolOpenBtn from "./tool-open-btn";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

export const kind = "excalidraw";
export const Icon = Pen;

export const Btn = () => {
  return (
    <ToolOpenBtn kind={kind} title={"画板"}>
      <Pen />
    </ToolOpenBtn>
  );
};

export const Panel = () => {
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
