import { type LanguageModelMiddleware } from "ai";
import type { CreateLLMFC } from "../types";

import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseekMiddleware: LanguageModelMiddleware = {};
const createLLMDeepseek: CreateLLMFC = (config, model) => {
  const deepseek = createDeepSeek(config);
  return deepseek.chat(model);
};

export default createLLMDeepseek;
