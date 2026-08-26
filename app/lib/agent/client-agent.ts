import { createDeepSeek } from "@ai-sdk/deepseek";
import { DirectChatTransport, ToolLoopAgent } from "ai";
import type { ChatTransport } from "ai";
import type {
  LLMConfig,
  LLMreasoning,
  Locale,
  MessageMetadataFn,
  ProviderId,
  TransportFCResult,
  TransportOptions,
  UIChatMessage,
} from "./types";
import { instructions } from "./instructions";
import { commonToolsConfig } from "./tools";

import { hashString } from "../id-utils";
import QuickLRU from "quick-lru";
import { useTranslation } from "react-i18next";
import { transports } from "./create-transport";
import { useMemo } from "react";

export const deepseek = createDeepSeek({
  apiKey: "",
});

export const deepseeks = deepseek.chat("deepseek-v4-flash");

export const agent = new ToolLoopAgent({
  id: "deepseek/deepseek-v4-flash",
  model: deepseeks,
  instructions,
  reasoning: "low",
  ...commonToolsConfig,
});

export const messageMetadata: MessageMetadataFn = ({ part }) => {
  if (part.type === "start-step") {
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

// 按 (provider, apiKey, baseURL, model, locale, reasoning) 缓存的 transport 实例，
// LRU 限制数量，防止配置切换多了之后无限堆积。
const TransportMap = new QuickLRU<string, TransportFCResult>({
  maxSize: 20,
});

const calcAgentKey = (
  providerId: ProviderId,
  config: LLMConfig,
  model: string,
  { locale = "en", reasoning = "none" }: TransportOptions,
) => {
  return hashString(
    `${providerId}:${config.apiKey}:${config.baseURL}:${model}:${locale}:${reasoning}`,
  );
};

export const useAgent = (
  providerId: ProviderId | undefined,
  config: LLMConfig | undefined,
  model: string | undefined,
  reasoning?: LLMreasoning,
): TransportFCResult | undefined => {
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
