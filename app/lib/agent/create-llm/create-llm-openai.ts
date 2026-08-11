import type { CreateLLMFC } from "../types";
import { createOpenAI } from "@ai-sdk/openai";

const createLLMOpenAI: CreateLLMFC = (config, model) => {
  const openai = createOpenAI({
    baseURL: config.base_url,
    apiKey: config.api_key,
  });
  return openai.chat(model);
};

export default createLLMOpenAI;
