import type {
  ChatTransport,
  InferAgentUIMessage,
  LanguageModel,
  TextStreamPart,
  ToolApprovalStatus,
  ToolSet,
} from "ai";
import type { agent } from "./client-agent";

import { ModelProvider } from "@lobehub/icons";

import type { FC } from "react";
import type { IconAvatarProps, IconType } from "@lobehub/icons";
import type { ChatMessage, SettingModelConfig } from "~/db/db-zod-schema";

/** Provider IDs — extends @lobehub/icons ModelProvider with custom entries */
export const ProviderId = {
  ...ModelProvider,
  /** Browser-local model (e.g. WebLLM) */
  Browser: "browser",
} as const;

export type ProviderId = (typeof ProviderId)[keyof typeof ProviderId];

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

export type MessageMetadata = NonNullable<ChatMessage["metadata"]>;

/** Agent-typed UI message, tools auto-inferred from agent */
type AgentType = typeof agent;
export type UIChatMessage = InferAgentUIMessage<AgentType, MessageMetadata>;
export type AgentTools = AgentType["tools"];
export type AgentToolApproval = Partial<
  Record<keyof AgentTools, ToolApprovalStatus>
>;
export type ToolsConfig = {
  toolApproval: AgentToolApproval;
  tools: AgentTools;
};

export type MessageMetadataFn = (options: {
  part: TextStreamPart<ToolSet>;
}) => MessageMetadata | undefined;
export type AvatarComponent = FC<Omit<IconAvatarProps, "Icon">>;

/** Form-managed subset of SettingModelConfig — single source of truth */
export type ProviderConfigValue = Omit<
  SettingModelConfig,
  "id" | "provider_id" | "extra" | "created_at" | "updated_at"
>;

export interface ModelProviderConfigProps {
  providerId: ProviderId;
  value?: ProviderConfigValue;
  onChange?: (value: ProviderConfigValue) => void;
}

export interface ModelIcon {
  id: ProviderId;
  name: string;
  avatar: AvatarComponent;
  text: IconType;
}

export type ModelIconRecord = Record<ProviderId, ModelIcon>;

export type ModelConfigUIRecord = Partial<
  Record<ProviderId, FC<ModelProviderConfigProps>>
>;

export type CreateChatTranSportAgentFC = (
  config: SettingModelConfig,
) => ChatTransport<UIChatMessage>;

export type LLMConfig = { apiKey: string; baseUrl: string };

export type CreateLLMFC = (config: LLMConfig, model: string) => LanguageModel;

export type CreateLLMs = Partial<Record<ProviderId, CreateLLMFC>>;

export type TestLLMConnectResult = {
  /** Whether the provider is reachable / available */
  ok: boolean;
} & Record<string, unknown>;

export type TestLLMConnectFC = (
  config: LLMConfig,
  model: string,
  onProgress?: (progress: number) => void,
) => Promise<TestLLMConnectResult>;

export type TestLLMConnects = Partial<Record<ProviderId, TestLLMConnectFC>>;

export type LLMreasoning =
  "provider-default" | "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
export interface TransportOptions {
  locale?: Locale;
  reasoning?: LLMreasoning;
}

export type TransportFCResult = {
  transport: ChatTransport<UIChatMessage>;
  model: LanguageModel;
};
export type TransportFC = (
  config: LLMConfig,
  model: string,
  options: TransportOptions,
) => TransportFCResult;

export type Transports = Partial<Record<ProviderId, TransportFC>>;
