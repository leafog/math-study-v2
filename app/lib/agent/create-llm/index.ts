import { ProviderId, type CreateLLMs } from "../types";
import createLLMDeepseek from "./create-llm-deepseek";

export const createLLMRecord: CreateLLMs = {
  [ProviderId.DeepSeek]: createLLMDeepseek,
};
