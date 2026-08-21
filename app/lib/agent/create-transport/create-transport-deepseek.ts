import { DirectChatTransport, ToolLoopAgent, type ChatTransport } from "ai";
import type { TransportFC, UIChatMessage } from "../types";
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
  const transport = new DirectChatTransport({
    agent,
    sendReasoning: true,
    messageMetadata,
  });
  return {
    transport,
    model: deepseek,
  };
};

export default createTransportDeepseek;
