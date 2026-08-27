import { lazy } from "react";
import ExclidrawPanel from "./tool-exclidraw";
import {
  Pen,
  Pi,
  ChartScatter,
  Notebook,
  Paperclip,
  ComputerIcon,
} from "lucide-react";
import type { Tools } from "./types";

const tools = {
  excalidraw: {
    kind: "excalidraw" as const,
    Icon: Pen,
    showInOpen: true,
    Panel: ExclidrawPanel,
  },
  mathlive: {
    kind: "mathlive" as const,
    Icon: Pi,
    showInOpen: true,
    Panel: lazy(() => import("./tool-mathlive")),
  },
  jsxgraph: {
    kind: "jsxgraph" as const,
    Icon: ChartScatter,
    showInOpen: true,
    Panel: lazy(() => import("./tool-jsxgraph")),
  },
  blocknote: {
    kind: "blocknote" as const,
    Icon: Notebook,
    showInOpen: true,
    Panel: lazy(() => import("./tool-mathlive")),
  },
  showAttachment: {
    kind: "showAttachment" as const,
    Icon: Paperclip,
    showInOpen: false,
    Panel: lazy(() => import("./tool-show-attachment")),
  },
  epsli: {
    kind: "epsli" as const,
    Icon: ComputerIcon,
    showInOpen: true,
    Panel: lazy(() => import("./tool-epsli")),
  },
} satisfies Tools;

/** 从各工具内容里的 kind 字段提取字面量联合 */
export type ToolKind = (typeof tools)[keyof typeof tools]["kind"];

export const kindToTool = (kind: string) => tools[kind as ToolKind];
export const hasToolKind = (kind: string): kind is ToolKind => kind in tools;
export const openableTools = Object.values(tools).filter(
  (tool) => tool.showInOpen,
);
