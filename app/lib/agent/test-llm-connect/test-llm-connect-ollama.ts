import { generateText } from "ai";
import createLLMOllama from "../create-llm/create-llm-ollama";
import type { TestLLMConnectFC } from "../types";

const testLLMConnectOllama: TestLLMConnectFC = async (config, model) => {
  const ollama = createLLMOllama(config, model);
  const { text } = await generateText({
    model: ollama,
    prompt: "I'm testing the connection. Just reply 'ok' and we're done.",
  });
  return { ok: text.length > 0 };
};

export default testLLMConnectOllama;
