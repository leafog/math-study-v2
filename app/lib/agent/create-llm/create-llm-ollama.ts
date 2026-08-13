import type { CreateLLMFC } from "../types";
import { createOllama } from "ollama-ai-provider-v2";

const createLLMOllama: CreateLLMFC = (config, model) => {
  const ollama = createOllama({
    baseURL: `${config.baseUrl.replace(/\/+$/, "")}/api`,
    compatibility: "strict",
  });
  return ollama.chat(model);
};

export default createLLMOllama;
