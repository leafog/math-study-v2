import type { UIMessage } from "ai";

type MessageMetadata = {
  createdAt: Date;
};
type ChatUIDataTypes = {};
type ChatTools = {};
export type UIChatMessage = UIMessage<
  MessageMetadata,
  ChatUIDataTypes,
  ChatTools
>;
