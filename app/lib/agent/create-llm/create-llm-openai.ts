import type { CreateLLMFC } from "../types";
import { createOpenAI } from "@ai-sdk/openai";

const createLLMOpenAI: CreateLLMFC = (config, model) => {
  const openai = createOpenAI(config);
  return openai.chat(model);
};

export default createLLMOpenAI;
