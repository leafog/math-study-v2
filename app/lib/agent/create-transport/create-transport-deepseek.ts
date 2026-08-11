import { createDeepSeek } from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { TransportFC } from "../types";
import { instructions } from "../instructions";

import { commonToolsConfig } from "../tools";
import createLLMDeepseek from "../create-llm/create-llm-deepseek";
import { messageMetadata } from "../client-agent";

const createTransportDeepseek: TransportFC = (config, model) => {
  const deepseek = createLLMDeepseek(config, model);

  const agent = new ToolLoopAgent({
    model: deepseek,

    instructions,
    ...commonToolsConfig,
  });
  return new DirectChatTransport({
    agent,
    sendReasoning: true,
    messageMetadata,
  });
};

export default createTransportDeepseek;
