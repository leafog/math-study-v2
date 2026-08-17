import { useTranslation } from "react-i18next";
import { ToolBlock } from "./_tool-common";
import type { ToolRendererProps } from "./types";
import ProblemPreview from "~/components/math/problem-preview";
import { useChatKgTopics, useChatProblems } from "~/hooks/chat/active-chat";

export const PracticeProblem = ({
  part,
}: ToolRendererProps<"tool-practiceProblem">) => {
  const { t } = useTranslation();

  return (
    <ToolBlock title={t("toolCall.title.practiceProblem")} part={part}>
      {part.state === "output-available" && (
        <ProblemByIdView problemId={part.output.id} />
      )}
    </ToolBlock>
  );
};

function ProblemByIdView({ problemId }: Readonly<{ problemId: string }>) {
  const {
    problemsMap,
    answerRecordsMap,
    answerAnalysisesMap,
    problemExplanationsMap,
    registerRef,
  } = useChatProblems();

  const { kgTopicsMap } = useChatKgTopics();
  const problem = problemsMap[problemId];
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
      chatId={problem.chat_id ?? undefined}
    />
  );
}
