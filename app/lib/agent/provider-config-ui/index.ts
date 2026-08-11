import { ProviderId, type ModelConfigUIRecord } from "../types";
import DeepSeekConfig from "./provider-deepseek";
import OpenAIConfig from "./provider-openai";
import AnthropicConfig from "./provider-anthropic";
import GeminiConfig from "./provider-gemini";
import KimiConfig from "./provider-kimi";

export const modelConfigUIRecord: ModelConfigUIRecord = {
  [ProviderId.DeepSeek]: DeepSeekConfig,
  [ProviderId.OpenAI]: OpenAIConfig,
  [ProviderId.Anthropic]: AnthropicConfig,
  [ProviderId.Gemini]: GeminiConfig,
  [ProviderId.Moonshot]: KimiConfig,
};
