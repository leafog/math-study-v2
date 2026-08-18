import mitt from "mitt";
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
};

export const bus = mitt<AppEvents>();
