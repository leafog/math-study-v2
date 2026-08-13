import { ProviderId, type Transports } from "../types";
import createTransportDeepseek from "./create-transport-deepseek";
import createTransportOpenAI from "./create-transport-openai";
import createTransportBrowser from "./create-transport-browser";
import createTransportOllama from "./create-transport-ollama";

export const transports: Transports = {
  [ProviderId.DeepSeek]: createTransportDeepseek,
  [ProviderId.OpenAI]: createTransportOpenAI,
  [ProviderId.Browser]: createTransportBrowser,
  [ProviderId.Ollama]: createTransportOllama,
};
