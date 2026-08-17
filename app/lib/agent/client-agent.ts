import { createDeepSeek } from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { ChatTransport } from "ai";
import type {
  LLMConfig,
  LLMreasoning,
  Locale,
  MessageMetadataFn,
  ProviderId,
  TransportOptions,
  UIChatMessage,
} from "./types";
import { createTopic } from "./tools/tool-create-topic";
import { linkTopics } from "./tools/tool-link-topics";
import { createRelationship } from "./tools/tool-create-relationship";
import { createProblem } from "./tools/tool-create-problem";
import { checkAnswer } from "./tools/tool-check-answer";
import { createExplanation } from "./tools/tool-create-explanation";
import { searchSimilarTopics } from "./tools/tool-search-similar-topics";
import { getKnowledgeGraph } from "./tools/tool-get-knowledge-graph";
import { instructions } from "./instructions";

import { hashString } from "../id-utils";
import { useTranslation } from "react-i18next";
import { transports } from "./create-transport";
import { useMemo } from "react";
import { invokeCortex } from "./tools/tool-invoke-cortex";
import { practiceProblem } from "./tools/tool-practice-problem";

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
    linkTopics: "approved",
    createRelationship: "approved",
    createProblem: "approved",
    checkAnswer: "approved",
    createExplanation: "approved",
    searchSimilarTopics: "approved",
    getKnowledgeGraph: "approved",
    invokeCortex: "approved",
    practiceProblem: "approved",
  },
  tools: {
    createTopic,
    linkTopics,
    createRelationship,
    createProblem,
    checkAnswer,
    createExplanation,
    searchSimilarTopics,
    getKnowledgeGraph,
    invokeCortex,
    practiceProblem,
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
const transport = new DirectChatTransport({
  agent,
  sendReasoning: true,
  messageMetadata,
});

const TransportMap = new Map<string, ChatTransport<UIChatMessage>>();

const calcAgentKey = (
  providerId: ProviderId,
  config: LLMConfig,
  model: string,
  { locale = "en", reasoning = "none" }: TransportOptions,
) => {
  return hashString(
    `${providerId}:${config.apiKey}:${config.baseUrl}:${model}:${locale}:${reasoning}`,
  );
};

export const useAgent = (
  providerId: ProviderId | undefined,
  config: LLMConfig | undefined,
  model: string | undefined,
  reasoning?: LLMreasoning,
): ChatTransport<UIChatMessage> | undefined => {
  const { i18n } = useTranslation();
  const locale: Locale = i18n.language?.startsWith("zh") ? "zh" : "en";

  const transport = useMemo(() => {
    if (!providerId || !config || !model) return undefined;
    const key = calcAgentKey(providerId, config, model, { locale, reasoning });

    const cached = TransportMap.get(key);
    if (cached) return cached;
    const createTransport = transports[providerId];
    if (!createTransport) return undefined;
    const transport = createTransport(config, model, { locale, reasoning });
    TransportMap.set(key, transport);
    return transport;
  }, [providerId, config, model, locale, reasoning]);

  return transport;
};
