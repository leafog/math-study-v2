import type { ComponentType } from "react";
import type { ToolUIPart, DynamicToolUIPart } from "ai";

export type ToolMessageRendererProps = {
  /** 来自 UIMessage.parts 的 tool part */
  part: ToolUIPart<any> | DynamicToolUIPart;
};

export type ToolMessageRenderer = {
  kind: string;
  Renderer: ComponentType<ToolMessageRendererProps>;
};
