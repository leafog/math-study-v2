import type { UIMessage } from "ai";

type MessageMetadata = {
  createdAt: string;
};
type ChatUIDataTypes = {};
type ChatTools = {};
export type ChatMessage = UIMessage<
  MessageMetadata,
  ChatUIDataTypes,
  ChatTools
>;
