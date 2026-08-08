import type { ComponentType, ReactNode } from "react";
import type { ToolPartRenderMap, AgentToolPart } from "./types";

import { CheckAnswer } from "./tool-ui-check-answer";
import { CreateProblem } from "./tool-ui-create-problem";
import { CreateTopic } from "./tool-ui-create-topic";
import { CreateRelationship } from "./tool-ui-create-relationship";
import { CreateExplanation } from "./tool-ui-create-explanation";
import { SearchSimilarTopics } from "./tool-ui-search-similar-topics";
import { GetKnowledgeGraph } from "./tool-ui-get-knowledge-graph";

type ToolKind = keyof ToolPartRenderMap;

const renderMap = {
  "tool-checkAnswer": CheckAnswer,
  "tool-createProblem": CreateProblem,
  "tool-createTopic": CreateTopic,
  "tool-createRelationship": CreateRelationship,
  "tool-createExplanation": CreateExplanation,
  "tool-searchSimilarTopics": SearchSimilarTopics,
  "tool-getKnowledgeGraph": GetKnowledgeGraph,
  "dynamic-tool": undefined,
} satisfies ToolPartRenderMap;

export const hasToolRenderer = (kind: string): kind is ToolKind =>
  kind in renderMap;

/** Narrow a message part to AgentToolPart */
export function isToolPart(part: { type: string }): part is AgentToolPart {
  return hasToolRenderer(part.type);
}

export function renderToolPart(part: AgentToolPart): ReactNode {
  // Widened lookup avoids TS union-complexity error when tools grow
  const R = (
    renderMap as Record<string, ComponentType<{ part: unknown }> | undefined>
  )[part.type];
  return R ? <R part={part} /> : null;
}
