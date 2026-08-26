import ProblemPreview from "~/components/math/problem-preview";
import { useChatKgTopics, useChatProblems } from "~/hooks/chat/active-chat";

/** 按 id 从库中连接题目，渲染成可交互的题目预览（含作答/判题/解析）。 */
export function ConnectedProblemView({
  problemId,
  chatId,
}: Readonly<{
  problemId: string;
  chatId?: string;
}>) {
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
      chatId={chatId}
    />
  );
}
