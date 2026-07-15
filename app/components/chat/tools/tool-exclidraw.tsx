import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Pen } from "lucide-react";
import ToolOpenBtn from "./tool-open-btn";

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
  return (
    <div className="size-full">
      <Excalidraw gridModeEnabled />
    </div>
  );
};
