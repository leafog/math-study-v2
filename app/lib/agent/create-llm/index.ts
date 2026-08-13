import { ProviderId, type CreateLLMs } from "../types";
import createLLMDeepseek from "./create-llm-deepseek";
import createLLMOpenAI from "./create-llm-openai";
import createLLMBrowser from "./create-llm-browser";

export const createLLMs: CreateLLMs = {
  [ProviderId.DeepSeek]: createLLMDeepseek,
  [ProviderId.OpenAI]: createLLMOpenAI,
  [ProviderId.Browser]: createLLMBrowser,
};
