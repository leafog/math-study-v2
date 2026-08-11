import { ProviderId, type Agents } from "./types";
import createAgentDeepseek from "./create-agent/create-agent-deepseek";

export const agentRecord: Agents = {
  [ProviderId.DeepSeek]: createAgentDeepseek,
};
