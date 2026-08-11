import type {
  Agent,
  ChatTransport,
  InferAgentUIMessage,
  LanguageModel,
  ToolLoopAgent,
} from "ai";
import type { agent } from "./client-agent";

import { ModelProvider as ProviderId } from "@lobehub/icons";
import type { FC } from "react";
import type { IconAvatarProps, IconType } from "@lobehub/icons";
import type { ChatMessage, SettingModelConfig } from "~/db/db-zod-schema";

export { ProviderId };

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
export type UIChatMessage = InferAgentUIMessage<typeof agent, MessageMetadata>;

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

export type CreateLLMFC = (
  config: ProviderConfigValue,
  model: string,
) => LanguageModel;

export type CreateLLMs = Partial<Record<ProviderId, CreateLLMFC>>;

export type TestLLMConnectFC = (
  config: ProviderConfigValue,
  model: string,
) => Promise<boolean>;

export type TestLLMConnects = Partial<Record<ProviderId, TestLLMConnectFC>>;

export type AgentFC = (config: ProviderConfigValue) => Agent;

export type Agents = Partial<Record<ProviderId, AgentFC>>;
