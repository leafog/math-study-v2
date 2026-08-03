import { keyBy } from "lodash-es";
import type { ToolMessageRenderer } from "./types";

import * as toolUiCheckAnswer from "./tool-ui-check-answer";
import * as toolUiCreateProblem from "./tool-ui-create-problem";
import * as toolUiCreateTopic from "./tool-ui-create-topic";
import * as toolUiCreateRelationship from "./tool-ui-create-relationship";
import * as toolUiCreateExplanation from "./tool-ui-create-explanation";

const rendererRegistry: ToolMessageRenderer[] = [
  { kind: toolUiCheckAnswer.kind, Renderer: toolUiCheckAnswer.Renderer },
  {
    kind: toolUiCreateProblem.kind,
    Renderer: toolUiCreateProblem.Renderer,
  },
  { kind: toolUiCreateTopic.kind, Renderer: toolUiCreateTopic.Renderer },
  {
    kind: toolUiCreateRelationship.kind,
    Renderer: toolUiCreateRelationship.Renderer,
  },
  {
    kind: toolUiCreateExplanation.kind,
    Renderer: toolUiCreateExplanation.Renderer,
  },
];

const registryMap = keyBy(rendererRegistry, "kind");

export const kindToRenderer = (kind: string) => registryMap[kind];
export const hasToolRenderer = (kind: string) => kind in registryMap;
