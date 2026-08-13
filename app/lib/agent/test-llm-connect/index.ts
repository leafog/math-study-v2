import { ProviderId, type TestLLMConnects } from "../types";
import testLLMConnectDeepseek from "./test-llm-connect-deepseek";
import testLLMConnectBrowser from "./test-llm-connect-browser";
import testLLMConnectOllama from "./test-llm-connect-ollama";

export const testLLMConnectRecord: TestLLMConnects = {
  [ProviderId.DeepSeek]: testLLMConnectDeepseek,
  [ProviderId.Browser]: testLLMConnectBrowser,
  [ProviderId.Ollama]: testLLMConnectOllama,
};
