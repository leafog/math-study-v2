import { useLiveQuery, eq } from "@tanstack/react-db";
import { keyBy, groupBy } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  toStateColor,
  type ProblemPreviewHandle,
} from "~/components/math/problem-preview";
import { scrollToProblem } from "~/components/math/scroll-utils";
import type { ProblemStateColor } from "~/components/math/type";
import { ProblemSchema } from "~/db/db-zod-schema";
import {
  problemColl,
  answerRecordColl,
  problemExplanationColl,
  answerAnalysisColl,
  problemChatRelColl,
} from "~/db/tdb-collections";
import { useEvent } from "~/event/use-event";

const useChatProblemsManager = (chatId: string) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const problemId = searchParams.get("problemId");

  const { data: problemsQuery } = useLiveQuery(
    (q) =>
      q
        .from({ problemChatRelColl })
        .join({ problemColl }, ({ problemChatRelColl, problemColl }) =>
          eq(problemChatRelColl.pid, problemColl.id),
        )
        .where(({ problemChatRelColl }) =>
          eq(problemChatRelColl.chat_id, chatId),
        )
        .orderBy(({ problemColl: col }) => col.created_at, {
          direction: "asc",
        })
        .select(({ problemColl }) => ({ ...problemColl })),
    [chatId],
  );

  // 过滤掉空/失效的题目：rel 行可能指向已删除的 problem，或 content 为空。
  const problems = useMemo(
    () =>
      (problemsQuery ?? [])
        .filter((it) => it !== undefined)
        .map((it) => ProblemSchema.parse(it)),
    [problemsQuery],
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
  const to = problemId ? refs.current.get(problemId) : undefined;

  useEffect(() => {
    if (problemId) {
      scrollToProblem(problemId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("problemId");
        return next;
      });
    }
  }, [to]);

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
