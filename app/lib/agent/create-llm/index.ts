import { ProviderId, type CreateLLMs } from "../types";
import createLLMDeepseek from "./create-llm-deepseek";
import createLLMOpenAI from "./create-llm-openai";

export const createLLMRecord: CreateLLMs = {
  [ProviderId.DeepSeek]: createLLMDeepseek,
  [ProviderId.OpenAI]: createLLMOpenAI,
};
