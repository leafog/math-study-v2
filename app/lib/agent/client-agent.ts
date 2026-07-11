import { createOpenAI } from "@ai-sdk/openai";
import { DirectChatTransport, ToolLoopAgent } from "ai";

export const deepseek = createOpenAI({
  apiKey: "",
  baseURL: "https://api.deepseek.com/v1",
  name: "deepseek",
});
export const deepseeks = deepseek.chat("deepseek-v4-flash");

export const agent = new ToolLoopAgent({
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  instructions: "",
});

export const transport = new DirectChatTransport({ agent });
