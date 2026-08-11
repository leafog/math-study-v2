import { createDeepSeek } from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent, wrapLanguageModel } from "ai";
import type { LanguageModelMiddleware } from "ai";
import type { MessageMetadataFn } from "./types";
import { createTopic } from "./tools/tool-create-topic";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { checkAnswer } from "./tools/tool-check-answer";
import { createExplanation } from "./tools/tool-create-explanation";
import { searchSimilarTopics } from "./tools/tool-search-similar-topics";
import { getKnowledgeGraph } from "./tools/tool-get-knowledge-graph";
import { instructions } from "./instructions";
import { useTranslation } from "react-i18next";
import {} from "./tools";
export const deepseek = createDeepSeek({
  apiKey: "",
});

export const deepseeks = deepseek.chat("deepseek-v4-flash");

export const agent = new ToolLoopAgent({
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  instructions,
  reasoning: "low",
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
export const messageMetadata: MessageMetadataFn = ({ part }) => {
  if (part.type === "start") {
    return { created_at: new Date() };
  }
  if (part.type === "reasoning-start") {
    return { [`${part.id}:${part.type}`]: Date.now() };
  }
  if (part.type === "reasoning-end") {
    return { [`${part.id}:${part.type}`]: Date.now() };
  }
};
export const transport = new DirectChatTransport({
  agent,
  sendReasoning: true,
  messageMetadata,
});

type UseAgentProps = {};
export const useAgent = ({}: UseAgentProps) => {
  const { i18n } = useTranslation();
};
