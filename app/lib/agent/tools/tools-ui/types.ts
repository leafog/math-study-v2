import type { ComponentType } from "react";
import type { InferUITools, ToolUIPart, DynamicToolUIPart } from "ai";
import type { agent } from "../../client-agent";

export type AgentUITools = InferUITools<typeof agent.tools>;

type ToolName<K extends string> = K extends `tool-${infer N}` ? N : never;

/** Map each tool kind to its specific part type */
export type ToolPartMap = {
  [K in `tool-${keyof AgentUITools & string}`]: ToolUIPart<
    Pick<AgentUITools, ToolName<K>>
  >;
} & {
  "dynamic-tool": DynamicToolUIPart;
};

/** AgentToolPart = the union of all values in ToolPartMap */
export type AgentToolPart = ToolPartMap[keyof ToolPartMap];

/** Generic renderer props, constrained by tool kind */
export type ToolRendererProps<K extends keyof ToolPartMap> = {
  part: ToolPartMap[K];
};

export type ToolPartRenderMap = {
  [K in keyof ToolPartMap]?: ComponentType<{ part: ToolPartMap[K] }>;
};
