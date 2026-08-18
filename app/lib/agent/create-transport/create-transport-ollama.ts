import { DirectChatTransport, ToolLoopAgent, type ChatTransport } from "ai";
import type { TransportFC, UIChatMessage } from "../types";
import { getPrompt } from "../instructions";

import { commonToolsConfig } from "../tools";
import createLLMOllama from "../create-llm/create-llm-ollama";
import { messageMetadata } from "../client-agent";

const createTransportOllama: TransportFC = (
  config,
  model,
  { locale = "en", reasoning = "provider-default" },
) => {
  const ollama = createLLMOllama(config, model);
  const instructions = getPrompt("system", {
    vars: { language: locale },
  });

  const agent = new ToolLoopAgent({
    model: ollama,
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
    model: ollama,
  };
};

export default createTransportOllama;
