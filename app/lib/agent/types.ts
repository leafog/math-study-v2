import type { InferAgentUIMessage } from "ai";
import type { agent } from "./client-agent";

export type Locale = "zh" | "en";

/** Known prompt keys — extend as needed */
export type PromptKey = "system" | (string & {});

export interface PromptOptions {
  locale?: Locale;
  vars?: Record<string, string>;
}

export interface PromptEntry {
  template: string;
  description?: string;
}

export type PromptRegistry = Record<string, PromptEntry>;

// ─── Chat message types ────────────────────────────────────

export type MessageMetadata = {
  created_at: Date;
};

/** Agent-typed UI message, tools auto-inferred from agent */
export type UIChatMessage = InferAgentUIMessage<typeof agent, MessageMetadata>;
