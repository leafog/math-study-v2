import type { ToolsConfig } from "../types";
import { createTopic } from "./tool-create-topic";
import { createRelationship } from "./tool-create-relationship";
import { createProblem } from "./tool-create-problem";
import { checkAnswer } from "./tool-check-answer";
import { createExplanation } from "./tool-create-explanation";
import { searchSimilarTopics } from "./tool-search-similar-topics";
import { getKnowledgeGraph } from "./tool-get-knowledge-graph";

export const commonToolsConfig: ToolsConfig = {
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
};
