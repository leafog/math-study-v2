import { generateText } from "ai";
import createLLMDeepseek from "../create-llm/create-llm-deepseek";
import type { TestLLMConnectFC } from "../types";

const testLLMConnectDeepseek: TestLLMConnectFC = async (config, model) => {
  const ds = createLLMDeepseek(config, model);
  const { text } = await generateText({
    model: ds,
    prompt: "I'm testing the connection. Just reply 'ok' and we're done.",
  });
  return { ok: text.length > 0 };
};

export default testLLMConnectDeepseek;
