import { useTranslation } from "react-i18next";
import { ToolBlock } from "./_tool-common";
import type { ToolRendererProps } from "./types";
import ProblemPreview from "~/components/math/problem-preview";
import { useChatKgTopics, useChatProblems } from "~/hooks/chat/active-chat";

export const CreateProblem = ({
  part,
}: ToolRendererProps<"tool-createProblem">) => {
  const { t } = useTranslation();

  return (
    <ToolBlock title={t("toolCall.title.createProblem")} part={part}>
      {part.state === "output-available" && (
        <div id={`problem-${part.output.id}`}>
          <ConnectedProblemView
            problemId={part.output.id}
            chatId={part.output.chat_id ?? undefined}
            tagIds={part.output.tags ?? []}
          />
        </div>
      )}
    </ToolBlock>
  );
};

function ConnectedProblemView({
  problemId,
  chatId,
}: Readonly<{
  problemId: string;
  chatId?: string;
  tagIds: string[];
}>) {
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
      kgTopics={(problem.tags ?? [])
        .map((it) => kgTopicsMap[it])
        .filter((it) => it !== undefined)}
      problemExplanations={problemExplanationsMap[problemId] ?? []}
      chatId={chatId}
    />
  );
}
