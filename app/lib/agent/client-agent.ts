import { createOpenAI } from "@ai-sdk/openai";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import { createTopic } from "./tools/tool-create-topic";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { instructions } from "./instructions";

export const deepseek = createOpenAI({
  // apiKey: "tp-cjzn3llnl6biwgkqtk37kboaq6yvjf3t62wekap4a5ttllnq",
  // baseURL: "https://token-plan-cn.xiaomimimo.com/v1",
  // name: "mimo",
  apiKey: "",
  baseURL: "https://api.deepseek.com",
  name: "deepseek",
});
export const deepseeks = deepseek.chat("deepseek-v4-flash");

//
export const agent = new ToolLoopAgent({
  // id: "mimo/mimo-v2.5",
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  instructions,
  toolApproval: {
    createTopic: "approved",
    createRelationship: "approved",
    createProblem: "approved",
  },
  tools: {
    createTopic,
    createRelationship,
    createProblem,
  },
});

export const transport = new DirectChatTransport({ agent });
