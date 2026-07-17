import type { UIMessage } from "ai";

type MessageMetadata = {
  created_at: Date;
};
type ChatUIDataTypes = {};
type ChatTools = {};
export type UIChatMessage = UIMessage<
  MessageMetadata,
  ChatUIDataTypes,
  ChatTools
>;
