import { createDeepSeek } from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { ChatTransport } from "ai";
import type {
  LLMConfig,
  Locale,
  MessageMetadataFn,
  ProviderId,
  UIChatMessage,
} from "./types";
import { createTopic } from "./tools/tool-create-topic";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { checkAnswer } from "./tools/tool-check-answer";
import { createExplanation } from "./tools/tool-create-explanation";
import { searchSimilarTopics } from "./tools/tool-search-similar-topics";
import { getKnowledgeGraph } from "./tools/tool-get-knowledge-graph";
import { instructions } from "./instructions";
import {} from "./tools";
import { genId, hashString } from "../id-utils";
import { useTranslation } from "react-i18next";
import { transports } from "./create-transport";

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
    const nowNumber = Date.now();
    return { [`${part.type}:${nowNumber}`]: nowNumber };
  }
  if (part.type === "reasoning-end") {
    const nowNumber = Date.now();
    return { [`${part.type}:${nowNumber}`]: nowNumber };
  }
};
export const transport = new DirectChatTransport({
  agent,
  sendReasoning: true,
  messageMetadata,
});
const TransportMap = new Map<string, ChatTransport<UIChatMessage>>();

const calcAgentKey = (
  providerId: ProviderId,
  config: LLMConfig,
  model: string,
  locale: Locale,
) => {
  return hashString(
    `${providerId}:${config.apiKey}:${config.baseUrl}:${model}:${locale}`,
  );
};

export const useAgent = (
  providerId: ProviderId | undefined,
  config: LLMConfig | undefined,
  model: string | undefined,
): ChatTransport<UIChatMessage> | undefined => {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith("zh") ? "zh" : "en";

  if (!providerId || !config || !model) return undefined;

  const key = calcAgentKey(providerId, config, model, locale);
  const cached = TransportMap.get(key);
  if (cached) return cached;

  const createTransport = transports[providerId];
  if (!createTransport) return undefined;

  const transport = createTransport(config, model, { locale });
  TransportMap.set(key, transport);
  return transport;
};
