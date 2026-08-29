import mitt from "mitt";
import type { ToolKind } from "../components/chat/tools";
export type ScrollToProblemCommand = {
  pid: string;
  toolCallId: string;
  /** 平滑(用户点击)或立即(初始定位) */
  behavior?: ScrollBehavior;
};

export type AppEvents = {
  "problem:scroll-to": string;
  "chat:scroll-to-problem": ScrollToProblemCommand;
  "topic:in-chat-view-topic": string;
  "push-prompt-input": string;
  "image:show-light-box": string;

  "open:tool:by-ref-id": {
    kind: ToolKind;
    title?: string;
    refId: string;
  };
  "open:tool:by-tool-id": {
    toolId: string;
  };

  "active:tool": {
    toolId: string;
  };
  "anno-click": {
    toolId: string;
    annoIdx: number;
  };
  "chat:create:by-open-tool": void;
};

export const bus = mitt<AppEvents>();
