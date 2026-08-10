import type { ProviderConfigDefinition } from "../types";
import DeepSeekConfig from "./provider-deepseek";
import OpenAIConfig from "./provider-openai";
import AnthropicConfig from "./provider-anthropic";
import GeminiConfig from "./provider-gemini";
import KimiConfig from "./provider-kimi";

export const providerConfigRegistry: ProviderConfigDefinition[] = [
  { id: "deepseek", Config: DeepSeekConfig },
  { id: "openai", Config: OpenAIConfig },
  { id: "anthropic", Config: AnthropicConfig },
  { id: "gemini", Config: GeminiConfig },
  { id: "kimi", Config: KimiConfig },
];

export const idToProviderConfig = (id: string) =>
  providerConfigRegistry.find((p) => p.id === id);

export type { ProviderConfigDefinition } from "../types";
