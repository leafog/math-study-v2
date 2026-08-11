import { createDeepSeek } from "@ai-sdk/deepseek";
import { ToolLoopAgent } from "ai";
import type { AgentFC } from "../types";
import { instructions } from "../instructions";
import { getKnowledgeGraph } from "../tools/tool-get-knowledge-graph";
import { searchSimilarTopics } from "../tools/tool-search-similar-topics";
import { createTopic } from "../tools/tool-create-topic";
import { createRelationship } from "../tools/tool-create-relationship";
import { createProblem } from "../tools/tool-create-problem";
import { checkAnswer } from "../tools/tool-check-answer";
import { createExplanation } from "../tools/tool-create-explanation";

const createAgentDeepseek = ((config) => {
  const deepseek = createDeepSeek({
    apiKey: config.api_key,
    baseURL: config.base_url,
  });

  return new ToolLoopAgent({
    model: deepseek.chat("deepseek-chat"),
    instructions,
    tools: {
      getKnowledgeGraph,
      searchSimilarTopics,
      createTopic,
      createRelationship,
      createProblem,
      checkAnswer,
      createExplanation,
    },
  });
}) satisfies AgentFC;

export default createAgentDeepseek;
