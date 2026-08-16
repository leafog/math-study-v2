import type { ToolsConfig } from "../types";
import { createTopic } from "./tool-create-topic";
import { linkTopics } from "./tool-link-topics";
import { createRelationship } from "./tool-create-relationship";
import { createProblem } from "./tool-create-problem";
import { checkAnswer } from "./tool-check-answer";
import { createExplanation } from "./tool-create-explanation";
import { searchSimilarTopics } from "./tool-search-similar-topics";
import { getKnowledgeGraph } from "./tool-get-knowledge-graph";
import { invokeCortex } from "./tool-invoke-cortex";

export const commonToolsConfig: ToolsConfig = {
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
  },
};
