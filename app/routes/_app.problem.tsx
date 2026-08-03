import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLiveInfiniteQuery, useLiveQuery } from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { FileQuestion } from "lucide-react";
import {
  problemColl,
  answerRecordColl,
  answerAnalysisColl,
  problemExplanationColl,
  kgTopicColl,
} from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";
import {
  Container,
  ContainerHeader,
  ContainerSticky,
  ContainerBody,
} from "~/components/layout/Container";
import ProblemPreview from "~/components/math/problem-preview";

const PAGE_SIZE = 20;

const ProblemIndex = () => {
  const { t } = useTranslation();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLiveInfiniteQuery(
      (q) =>
        q
          .from({ problemColl })
          .orderBy(({ problemColl: col }) => col.created_at, {
            direction: "desc",
          }),
      { pageSize: PAGE_SIZE },
    );

  const problems = (data ?? []) as ProblemType[];

  // Bulk queries for related data
  const { data: allAnswers = [] } = useLiveQuery((q) =>
    q.from({ answerRecordColl }),
  );
  const { data: allAnalyses = [] } = useLiveQuery((q) =>
    q.from({ answerAnalysisColl }),
  );
  const { data: allExplanations = [] } = useLiveQuery((q) =>
    q.from({ problemExplanationColl }),
  );
  const { data: allTopics = [] } = useLiveQuery((q) =>
    q.from({ kgTopicColl }),
  );

  // Index related data by problem ID
  const answersByProblem = useMemo(() => {
    const map = new Map<string, typeof allAnswers>();
    for (const a of allAnswers) {
      const list = map.get(a.problem_id) ?? [];
      list.push(a);
      map.set(a.problem_id, list);
    }
    return map;
  }, [allAnswers]);

  const analysesByAnswer = useMemo(() => {
    const map = new Map<string, (typeof allAnalyses)[0]>();
    for (const a of allAnalyses) map.set(a.answer_id, a);
    return map;
  }, [allAnalyses]);

  const explanationsByProblem = useMemo(() => {
    const map = new Map<string, typeof allExplanations>();
    for (const e of allExplanations) {
      const list = map.get(e.problem_id) ?? [];
      list.push(e);
      map.set(e.problem_id, list);
    }
    return map;
  }, [allExplanations]);

  const topicMap = useMemo(() => {
    const map = new Map<string, (typeof allTopics)[0]>();
    for (const t of allTopics) map.set(t.id, t);
    return map;
  }, [allTopics]);

  const [filterSource, setFilterSource] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filterSource) return problems;
    return problems.filter((p) => p.source === filterSource);
  }, [problems, filterSource]);

  const sourceCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of problems) c[p.source] = (c[p.source] ?? 0) + 1;
    return c;
  }, [problems]);

  // Infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage)
        fetchNextPage();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const o = new IntersectionObserver(handleObserver, { rootMargin: "400px" });
    o.observe(el);
    return () => o.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <Container>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("common.loading")}
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <ContainerHeader className="h-20 mt-10">
        <div className="flex h-full justify-between items-center">
          <div>
            <h1 className="text-3xl font-mono">{t("problem.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("problem.subtitle")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">
              {problems.length}
            </span>{" "}
            {t("problem.total")}
          </p>
        </div>
      </ContainerHeader>

      <ContainerSticky className="flex items-center gap-1.5 flex-wrap">
        123
      </ContainerSticky>
      <ContainerBody>
        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="rounded-full bg-muted p-4">
                <FileQuestion className="size-6" aria-hidden="true" />
              </div>
              <p className="text-sm">
                {filterSource ? t("problem.noFiltered") : t("problem.empty")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 flex flex-col gap-4">
              {filtered.map((p) => (
                <ProblemPreview
                  key={p.id}
                  problem={p}
                  answers={answersByProblem.get(p.id) ?? []}
                  answerAnalyses={
                    (answersByProblem.get(p.id) ?? [])
                      .map((a) => analysesByAnswer.get(a.id))
                      .filter(Boolean) as typeof allAnalyses
                  }
                  kgTopics={p.tags
                    .map((id) => topicMap.get(id))
                    .filter(Boolean) as typeof allTopics}
                  problemExplanations={explanationsByProblem.get(p.id) ?? []}
                  className="m-0 hover:shadow-md transition-shadow duration-200"
                />
              ))}
            </div>

            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center pb-6">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
              </div>
            )}
          </>
        )}
      </ContainerBody>
    </Container>
  );
};

export default ProblemIndex;
