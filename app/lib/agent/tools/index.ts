import type { ToolApprovalStatus } from "ai";
import { createTopic } from "./tool-create-topic";
import { linkTopics } from "./tool-link-topics";
import { createRelationship } from "./tool-create-relationship";
import { createProblem } from "./tool-create-problem";
import { createProblemsByAttachment } from "./tool-create-problems-by-attachment";
import { checkAnswer } from "./tool-check-answer";
import { createExplanation } from "./tool-create-explanation";
import { searchSimilarTopics } from "./tool-search-similar-topics";
import { getKnowledgeGraph } from "./tool-get-knowledge-graph";
import { invokeCortex } from "./tool-invoke-cortex";
import { practiceProblem } from "./tool-practice-problem";
import { practiceProblems } from "./tool-practice-problems";

export const commonToolsConfig = {
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
    practiceProblems: "approved",
    createProblemsByAttachment: "approved",
  } satisfies Partial<Record<string, ToolApprovalStatus>>,
  tools: {
    createTopic,
    linkTopics,
    createRelationship,
    createProblem,
    createProblemsByAttachment,
    checkAnswer,
    createExplanation,
    searchSimilarTopics,
    getKnowledgeGraph,
    invokeCortex,
    practiceProblem,
    practiceProblems,
  },
};
