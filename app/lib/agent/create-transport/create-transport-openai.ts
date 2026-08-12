import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { TransportFC } from "../types";
import { getPrompt } from "../instructions";

import { commonToolsConfig } from "../tools";
import createLLMOpenAI from "../create-llm/create-llm-openai";
import { messageMetadata } from "../client-agent";

const createTransportOpenAI: TransportFC = (config, model, options) => {
  const openai = createLLMOpenAI(config, model);
  const locale = options.locale ?? "en";
  const instructions = getPrompt("system", {
    vars: { language: locale },
  });

  const agent = new ToolLoopAgent({
    model: openai,
    instructions,
    ...commonToolsConfig,
  });
  return new DirectChatTransport({
    agent,
    sendReasoning: true,
    messageMetadata,
  });
};

export default createTransportOpenAI;
