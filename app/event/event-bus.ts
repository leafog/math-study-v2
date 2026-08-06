import mitt from "mitt";
export type AppEvents = {
  "problem:scroll-to": string;
  "problem:open-explanation": string;
  "problem:open-answer-record": string;
  "topic:in-chat-view-topic": string;
  "push-prompt-input": string;
};

export const bus = mitt<AppEvents>();
