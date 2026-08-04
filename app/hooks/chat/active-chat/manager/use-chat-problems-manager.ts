import { useLiveQuery, eq } from "@tanstack/react-db";
import { keyBy, groupBy } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  toStateColor,
  type ProblemPreviewHandle,
} from "~/components/math/problem-preview";
import {
  onOpenExplanation,
  onOpenAnswerRecords,
  onScrollToProblem,
} from "~/components/math/scroll-utils";
import type { ProblemStateColor } from "~/components/math/type";
import {
  problemColl,
  answerRecordColl,
  problemExplanationColl,
  answerAnalysisColl,
} from "~/db/tdb-collections";

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
  const problemsMap = useMemo(
    () => keyBy(problems, (it) => it.id),
    [problems],
  );

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

  useEffect(() => {
    const u1 = onOpenExplanation((pid) =>
      refs.current.get(pid)?.openExplanation(),
    );
    const u2 = onOpenAnswerRecords((pid) =>
      refs.current.get(pid)?.openAnswerRecord(),
    );
    const u3 = onScrollToProblem((pid) => {
      refs.current.get(pid)?.highlight();
    });
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  return {
    problems,
    problemsMap,
    answerRecordsMap,
    answerAnalysisesMap,
    problemExplanationsMap,
    toStateColorByPid,
    registerRef,
  };
};

export default useChatProblemsManager;
