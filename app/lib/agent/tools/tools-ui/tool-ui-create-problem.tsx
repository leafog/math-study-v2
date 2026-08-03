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
  tagIds,
}: {
  problemId: string;
  chatId?: string;
  tagIds: string[];
}) {
  const { data: problem } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.id, problemId))
        .findOne(),
    [problemId],
  );

  const { data: answers = [] } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) => eq(col.problem_id, problemId)),
    [problemId],
  );

  const { data: answerAnalyses = [] } = useLiveQuery((q) =>
    q.from({ answerAnalysisColl }),
  );

  const { data: explanations = [] } = useLiveQuery(
    (q) =>
      q
        .from({ problemExplanationColl })
        .where(({ problemExplanationColl: col }) =>
          eq(col.problem_id, problemId),
        ),
    [problemId],
  );

  const { data: allTopics = [] } = useLiveQuery((q) => q.from({ kgTopicColl }));
  const kgTopics = allTopics.filter((t) => tagIds.includes(t.id));

  if (!problem) return null;

  return (
    <ProblemPreview
      problem={problem}
      answers={answers}
      answerAnalyses={answerAnalyses}
      kgTopics={kgTopics}
      problemExplanations={explanations}
      chatId={chatId}
    />
  );
}

export const kind = "tool-createProblem";
export const Renderer = CreateProblemRenderer;
