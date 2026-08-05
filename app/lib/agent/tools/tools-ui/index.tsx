import type { ReactNode } from "react";
import type { ToolPartRenderMap, AgentToolPart } from "./types";

import { CheckAnswer } from "./tool-ui-check-answer";
import { CreateProblem } from "./tool-ui-create-problem";
import { CreateTopic } from "./tool-ui-create-topic";
import { CreateRelationship } from "./tool-ui-create-relationship";
import { CreateExplanation } from "./tool-ui-create-explanation";

type ToolKind = keyof ToolPartRenderMap;

const renderMap = {
  "tool-checkAnswer": CheckAnswer,
  "tool-createProblem": CreateProblem,
  "tool-createTopic": CreateTopic,
  "tool-createRelationship": CreateRelationship,
  "tool-createExplanation": CreateExplanation,
  "tool-searchSimilarTopics": undefined,
  "dynamic-tool": undefined,
} satisfies ToolPartRenderMap;

export const hasToolRenderer = (kind: string): kind is ToolKind =>
  kind in renderMap;

/** Narrow a message part to AgentToolPart */
export function isToolPart(part: { type: string }): part is AgentToolPart {
  return hasToolRenderer(part.type);
}

export function renderToolPart(part: AgentToolPart): ReactNode {
  const R = renderMap[part.type];
  return R ? <R part={part as never} /> : null;
}
