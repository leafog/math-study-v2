import { ProviderId, type TestLLMConnects } from "../types";
import testLLMConnectDeepseek from "./test-llm-connect-deepseek";
import testLLMConnectBrowser from "./test-llm-connect-browser";

export const testLLMConnectRecord: TestLLMConnects = {
  [ProviderId.DeepSeek]: testLLMConnectDeepseek,
  [ProviderId.Browser]: testLLMConnectBrowser,
};
