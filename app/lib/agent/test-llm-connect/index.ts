import { ProviderId, type TestLLMConnects } from "../types";
import testLLMConnectDeepseek from "./test-llm-connect-deepseek";

export const testLLMConnectRecord: TestLLMConnects = {
  [ProviderId.DeepSeek]: testLLMConnectDeepseek,
};
