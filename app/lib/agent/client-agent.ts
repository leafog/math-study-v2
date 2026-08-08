import { createOpenAI } from "@ai-sdk/openai";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import { createTopic } from "./tools/tool-create-topic";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { checkAnswer } from "./tools/tool-check-answer";
import { createExplanation } from "./tools/tool-create-explanation";
import { searchSimilarTopics } from "./tools/tool-search-similar-topics";
import { getKnowledgeGraph } from "./tools/tool-get-knowledge-graph";
import { instructions } from "./instructions";

export const deepseek = createOpenAI({
  // apiKey: "ollama",
  // baseURL: "http://localhost:11434/v1",
  // name: "minicpm-v4.6",
  // apiKey: "tp-cjzn3llnl6biwgkqtk37kboaq6yvjf3t62wekap4a5ttllnq",
  // baseURL: "https://token-plan-cn.xiaomimimo.com/v1",
  // name: "mimo",
  apiKey: "",
  baseURL: "https://api.deepseek.com",
  name: "deepseek",
  // apiKey:
  //   "sk-sp-H.DMIXPE.UZqI.MEYCIQDhpXxIagDn9gCmL1YJTASQf2M_m6gAfCsEEPq7xXd2WAIhAOQ7zMT8NF6GCtitl53BgTatNNlZJ2oVJMRlze8fKiZV",
  // baseURL: "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
  // name: "deepseek",
});
export const deepseeks = deepseek.chat("deepseek-v4-flash");

//
export const agent = new ToolLoopAgent({
  // id: "mimo/mimo-v2.5",
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  instructions,
  reasoning: "medium", // provider-default | none | minimal | low | medium | high | xhigh

  toolApproval: {
    createTopic: "approved",
    createRelationship: "approved",
    createProblem: "approved",
    checkAnswer: "approved",
    createExplanation: "approved",
    searchSimilarTopics: "approved",
    getKnowledgeGraph: "approved",
  },
  tools: {
    createTopic,
    createRelationship,
    createProblem,
    checkAnswer,
    createExplanation,
    searchSimilarTopics,
    getKnowledgeGraph,
  },
});

export const transport = new DirectChatTransport({
  agent,
  messageMetadata({ part }) {
    if (part.type === "start") {
      return { created_at: new Date() };
    }
  },
});
