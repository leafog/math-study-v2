import {
  createDeepSeek,
  type DeepSeekLanguageModelChatOptions,
} from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent, wrapLanguageModel } from "ai";
import type { LanguageModelMiddleware } from "ai";
import { createTopic } from "./tools/tool-create-topic";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { checkAnswer } from "./tools/tool-check-answer";
import { createExplanation } from "./tools/tool-create-explanation";
import { searchSimilarTopics } from "./tools/tool-search-similar-topics";
import { getKnowledgeGraph } from "./tools/tool-get-knowledge-graph";
import { instructions } from "./instructions";
import { useTranslation } from "react-i18next";

export const deepseek = createDeepSeek({
  apiKey: "",
});

export const deepseeks = deepseek.chat("deepseek-v4-flash");

// Middleware to enable DeepSeek thinking (reasoning_content) + reasoning effort.
// @ai-sdk/deepseek natively handles:
//   - thinking: { type: "enabled" }  →  opens the "thinking" extra_body
//   - reasoningEffort: "high"        →  reasoning_effort in the request
//   - Response: reasoning_content is parsed into standard reasoning events
//     (reasoning-start / reasoning-delta / reasoning-end in streams,
//      { type: "reasoning", text } in generate)
const thinkingMiddleware: LanguageModelMiddleware = {
  transformParams: async ({ params }) => {
    return {
      ...params,
      providerOptions: {
        ...params.providerOptions,
        deepseek: {
          thinking: { type: "enabled" as const },
          reasoningEffort: "high" as const,
        },
      },
    };
  },
};

// Model with thinking enabled — reasoning_content is fully handled by the SDK.
export const deepseekThinking = wrapLanguageModel({
  model: deepseeks,
  middleware: thinkingMiddleware,
});

//
export const agent = new ToolLoopAgent({
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  providerOptions: {
    deepseek: {
      thinking: { type: "enabled" },
      reasoningEffort: "high",
    } satisfies DeepSeekLanguageModelChatOptions,
  },

  instructions,
  reasoning: "low", // provider-default | none | minimal | low | medium | high | xhigh

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
  sendReasoning: true,
  messageMetadata({ part }) {
    if (part.type === "start") {
      return { created_at: new Date() };
    }
  },
});
type UseAgentProps = {};
export const useAgent = ({}: UseAgentProps) => {
  const { i18n } = useTranslation();
  const locale = i18n.language;
};
