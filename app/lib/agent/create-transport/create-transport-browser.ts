import { DirectChatTransport, ToolLoopAgent, type ChatTransport } from "ai";
import type { TransportFC, UIChatMessage } from "../types";
import { getPrompt } from "../instructions";
import createLLMBrowser from "../create-llm/create-llm-browser";
import { messageMetadata } from "../client-agent";

const createTransportBrowser: TransportFC = (
  config,
  model,
  { locale = "en", reasoning = "provider-default" },
) => {
  const browser = createLLMBrowser(config, model);

  const instructions = getPrompt("system", {
    vars: { language: locale },
  });

  const agent = new ToolLoopAgent({
    model: browser,
    instructions,
    reasoning: "none",
  });

  const transport = new DirectChatTransport({
    agent,
    sendReasoning: true,
    messageMetadata,
  }) as unknown as ChatTransport<UIChatMessage>;
  return {
    transport,
    model: browser,
  };
};

export default createTransportBrowser;
