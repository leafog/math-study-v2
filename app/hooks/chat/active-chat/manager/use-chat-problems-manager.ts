import { useLiveQuery, eq } from "@tanstack/react-db";
import { keyBy, groupBy } from "lodash-es";
import { useCallback, useMemo, useRef } from "react";
import {
  toStateColor,
  type ProblemPreviewHandle,
} from "~/components/math/problem-preview";
import type { ProblemStateColor } from "~/components/math/type";
import {
  problemColl,
  answerRecordColl,
  problemExplanationColl,
  answerAnalysisColl,
} from "~/db/tdb-collections";
import { useEvent } from "~/event/use-event";

const useChatProblemsManager = (chatId: string) => {
  const { data: problems } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.chat_id, chatId))
        .orderBy(({ problemColl: col }) => col.created_at, {
          direction: "asc",
        }),
    [chatId],
  );
  const problemsMap = useMemo(() => keyBy(problems, (it) => it.id), [problems]);

  const { data: answerRecords } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) => eq(col.chat_id, chatId))
        .orderBy(({ answerRecordColl: col }) => col.created_at, {
          direction: "asc",
        }),

    [chatId],
  );
  const answerRecordsMap = useMemo(
    () => groupBy(answerRecords ?? [], (it) => it.problem_id),
    [answerRecords],
  );

  const { data: problemExplanations } = useLiveQuery(
    (q) =>
      q
        .from({ problemExplanationColl })
        .where(({ problemExplanationColl: col }) => eq(col.chat_id, chatId)),
    [chatId],
  );
  const problemExplanationsMap = useMemo(
    () => groupBy(problemExplanations ?? [], (it) => it.problem_id),
    [problemExplanations],
  );
  const { data: answerAnalysises } = useLiveQuery(
    (q) =>
      q
        .from({ answerAnalysisColl })
        .where(({ answerAnalysisColl: col }) => eq(col.chat_id, chatId)),
    [chatId],
  );

  const answerAnalysisesMap = useMemo(
    () => groupBy(answerAnalysises ?? [], (it) => it.problem_id),
    [answerAnalysises],
  );
  const toStateColorByPid = (pid: string): ProblemStateColor => {
    const answers = answerRecordsMap[pid] ?? [];
    return toStateColor(answers);
  };
  const refs = useRef<Map<string, ProblemPreviewHandle>>(new Map());

  const registerRef = useCallback(
    (id: string) => (el: ProblemPreviewHandle | null) => {
      if (el) refs.current.set(id, el);
      else refs.current.delete(id);
    },
    [],
  );

  useEvent("problem:open-explanation", (pid) => {
    refs.current.get(pid)?.openExplanation();
  });
  useEvent("problem:open-answer-record", (pid) => {
    refs.current.get(pid)?.openAnswerRecord();
  });
  useEvent("problem:scroll-to", (pid) => {
    refs.current.get(pid)?.highlight();
  });
  const problemHasanswers = useCallback(
    (pid: string) => {
      return (answerRecordsMap[pid] ?? []).length > 0;
    },
    [answerRecordsMap],
  );
  const problemHasExplanations = useCallback(
    (pid: string) => {
      return (problemExplanationsMap[pid] ?? []).length > 0;
    },
    [problemExplanationsMap],
  );

  return {
    problems,
    problemsMap,
    answerRecordsMap,
    answerAnalysisesMap,
    problemExplanationsMap,
    toStateColorByPid,
    registerRef,
    problemHasanswers,
    problemHasExplanations,
  };
};

export default useChatProblemsManager;
