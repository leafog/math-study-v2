import { lazy } from "react";
import type { ToolDefinition } from "./types";
import { keyBy } from "lodash-es";

const lazyTool = (importFn: () => Promise<any>, exportName: string) =>
  lazy(() => importFn().then((m) => ({ default: m[exportName] })));

const loadTool = (
  kind: string,
  importFn: () => Promise<any>,
): ToolDefinition => ({
  kind,
  Icon: lazyTool(importFn, "Icon"),
  Panel: lazyTool(importFn, "Panel"),
});

export const toolRegistry: ToolDefinition[] = [
  loadTool("excalidraw", () => import("./tool-exclidraw")),
];

const toolRegistryMap = keyBy(toolRegistry, "kind");

export const kindToTool = (kind: string) => toolRegistryMap[kind];
export const hasToolKind = (kind: string) => kind in toolRegistryMap;

export type { ToolDefinition } from "./types";
