import { generateText } from "ai";
import createLLMDeepseek from "../create-llm/create-llm-deepseek";
import type { TestLLMConnectFC } from "../types";

const testLLMConnectDeepseek: TestLLMConnectFC = async (config, _model) => {
  const ds = createLLMDeepseek(config, "deepseek-v4-flash");
  const { text } = await generateText({
    model: ds,
    prompt: "我在测试你能否连上 可以回一个ok 就完事 ",
  });
  console.log(text);
  return text.length > 0;
};

export default testLLMConnectDeepseek;
