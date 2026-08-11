import type { CreateLLMFC } from "../types";
import { createDeepSeek } from "@ai-sdk/deepseek";

const createLLMDeepseek: CreateLLMFC = (config, model) => {
  const deepseek = createDeepSeek({
    baseURL: config.base_url,
    apiKey: config.api_key,
  });
  return deepseek.chat(model);
};

export default createLLMDeepseek;
