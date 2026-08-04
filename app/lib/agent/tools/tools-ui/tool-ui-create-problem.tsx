import { useLiveQuery, eq } from "@tanstack/react-db";
import {
  problemColl,
  answerRecordColl,
  answerAnalysisColl,
  problemExplanationColl,
  kgTopicColl,
} from "~/db/tdb-collections";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolMessageRendererProps } from "./types";
import ProblemPreview from "~/components/math/problem-preview";
import { useChatKgTopics, useChatProblems } from "~/hooks/chat/active-chat";
import type { Problem } from "~/db/db-zod-schema";

function CreateProblemRenderer({ part }: ToolMessageRendererProps) {
  if (part.state === "output-available") {
    const r = part.output as {
      id: string;
      content: string;
      description?: string | null;
      source?: string;
      chat_id?: string | null;
      tags?: string[];
    };
    return (
      <div id={`problem-${r.id}`}>
        <ConnectedProblemView
          problemId={r.id}
          chatId={r.chat_id ?? undefined}
          tagIds={r.tags ?? []}
        />
      </div>
    );
  }

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.creatingProblem"
      errorKey="toolCall.createProblemFailed"
    />
  );
}

function ConnectedProblemView({
  problemId,
  chatId,
}: {
  problemId: string;
  chatId?: string;
  tagIds: string[];
}) {
  const {
    problemsMap,
    answerRecordsMap,
    answerAnalysisesMap,
    problemExplanationsMap,
  } = useChatProblems();
  const { kgTopicsMap } = useChatKgTopics();

  const problem = problemsMap[problemId];

  const { registerRef } = useChatProblems();
  if (!problem) return null;

  return (
    <ProblemPreview
      ref={registerRef(problem.id)}
      problem={problem}
      answers={answerRecordsMap[problemId] ?? []}
      answerAnalyses={answerAnalysisesMap[problemId] ?? []}
      kgTopics={(problem.tags ?? []).map((it) => kgTopicsMap[it])}
      problemExplanations={problemExplanationsMap[problemId] ?? []}
      chatId={chatId}
    />
  );
}

export const kind = "tool-createProblem";
export const Renderer = CreateProblemRenderer;
