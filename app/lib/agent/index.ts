import {
  Anthropic,
  Browserless,
  DeepSeek,
  Gemini,
  Kimi,
  Ollama,
  OpenAI,
} from "@lobehub/icons";
import { keyBy } from "lodash-es";
import { ProviderId, type ModelIcon, type ModelIconRecord } from "./types";

export const modelIcons: ModelIcon[] = [
  {
    id: ProviderId.DeepSeek,
    name: "DeepSeek",
    avatar: DeepSeek.Avatar,
    text: DeepSeek.Text,
  },
  {
    id: ProviderId.OpenAI,
    name: "OpenAI",
    avatar: OpenAI.Avatar,
    text: OpenAI.Text,
  },
  {
    id: ProviderId.Anthropic,
    name: "Anthropic",
    avatar: Anthropic.Avatar,
    text: Anthropic.Text,
  },
  {
    id: ProviderId.Gemini,
    name: "Gemini",
    avatar: Gemini.Avatar,
    text: Gemini.Text,
  },
  {
    id: ProviderId.Moonshot,
    name: "Kimi",
    avatar: Kimi.Avatar,
    text: Kimi.Text,
  },
  {
    id: ProviderId.Browser,
    name: "Browser",
    avatar: Browserless.Avatar,
    text: Browserless.Text,
  },
  {
    id: ProviderId.Ollama,
    name: "Ollama",
    avatar: Ollama.Avatar,
    text: Ollama.Text,
  },
];
export { modelConfigUIs } from "./provider-config-ui";

export const modelIconRecord: ModelIconRecord = keyBy(
  modelIcons,
  "id",
) as ModelIconRecord;

export { testLLMConnectRecord } from "./test-llm-connect";
export { transports } from "./create-transport";
