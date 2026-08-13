import type { CreateLLMFC } from "../types";
import { createBrowserAI } from "@browser-ai/core";

const createLLMBrowserAI: CreateLLMFC = (config, model) => {
  const browserAI = createBrowserAI(config);
  return browserAI.chat("text");
};

export default createLLMBrowserAI;
