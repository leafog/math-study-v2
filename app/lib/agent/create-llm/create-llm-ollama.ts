import type { CreateLLMFC } from "../types";
import { createOllama } from "ollama-ai-provider-v2";

const createLLMOllama: CreateLLMFC = (config, model) => {
  const ollama = createOllama({
    baseURL: `${config.baseURL.replace(/\/+$/, "")}/api`,
    compatibility: "strict",
  });
  return ollama.chat(model);
};

export default createLLMOllama;
