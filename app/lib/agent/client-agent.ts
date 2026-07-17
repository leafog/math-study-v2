import { createOpenAI } from "@ai-sdk/openai";
import { DirectChatTransport, ToolLoopAgent } from "ai";

export const deepseek = createOpenAI({
  apiKey: "tp-cjzn3llnl6biwgkqtk37kboaq6yvjf3t62wekap4a5ttllnq",
  baseURL: "https://token-plan-cn.xiaomimimo.com/v1",
  name: "mimo",
});
export const deepseeks = deepseek.chat("mimo-v2.5");

export const agent = new ToolLoopAgent({
  id: "mimo/mimo-v2.5",
  model: deepseeks,
  instructions: "",
});

export const transport = new DirectChatTransport({ agent });
