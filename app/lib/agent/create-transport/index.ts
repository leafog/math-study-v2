import { ProviderId, type Transports } from "../types";
import createTransportDeepseek from "./create-transport-deepseek";
import createTransportOpenAI from "./create-transport-openai";

export const transports: Transports = {
  [ProviderId.DeepSeek]: createTransportDeepseek,
  [ProviderId.OpenAI]: createTransportOpenAI,
};
