import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { TransportFC } from "../types";
import { getPrompt } from "../instructions";

import { commonToolsConfig } from "../tools";
import createLLMDeepseek from "../create-llm/create-llm-deepseek";
import { messageMetadata } from "../client-agent";

const createTransportDeepseek: TransportFC = (
  config,
  model,
  { locale = "en", reasoning = "provider-default" },
) => {
  const deepseek = createLLMDeepseek(config, model);
  const instructions = getPrompt("system", {
    vars: { language: locale },
  });

  const agent = new ToolLoopAgent({
    model: deepseek,
    instructions,
    reasoning,
    ...commonToolsConfig,
  });
  return new DirectChatTransport({
    agent,
    sendReasoning: true,
    messageMetadata,
  });
};

export default createTransportDeepseek;
