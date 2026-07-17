import { lazy } from "react";
import type { ToolDefinition } from "./types";
import { keyBy } from "lodash-es";

const loadTool = (
  kind: string,
  importFn: () => Promise<any>,
): ToolDefinition => ({
  kind,
  Icon: lazy(() => importFn().then((m) => ({ default: m.default.Icon }))),
  Panel: lazy(() => importFn().then((m) => ({ default: m.default.Panel }))),
});

export const toolRegistry: ToolDefinition[] = [
  loadTool("excalidraw", () => import("./tool-exclidraw")),
  loadTool("mathlive", () => import("./tool-mathlive")),
  loadTool("jsxgraph", () => import("./tool-jsxgraph")),
];

const toolRegistryMap = keyBy(toolRegistry, "kind");

export const kindToTool = (kind: string) => toolRegistryMap[kind];
export const hasToolKind = (kind: string) => kind in toolRegistryMap;

export type { ToolDefinition } from "./types";
