import { useMemo, useEffect, useCallback, useRef } from "react";
import {
  count,
  inArray,
  useLiveInfiniteQuery,
  useLiveQuery,
} from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { groupBy } from "lodash-es";
import { FileQuestion, Loader2, Search, X } from "lucide-react";
import {
  problemColl,
  answerRecordColl,
  answerAnalysisColl,
  problemExplanationColl,
} from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";
import {
  Container,
  ContainerHeader,
  ContainerSticky,
  ContainerBody,
} from "~/components/layout/Container";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import ProblemPreview from "~/components/math/problem-preview";
import { useChatKgTopics } from "~/hooks/chat/active-chat";
import { Input } from "~/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";

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
  const pids = useMemo(() => problems.map((it) => it.id), [problems]);

  // Bulk queries for related data
  const { data: answerRecords = [] } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl }) =>
          inArray(answerRecordColl.problem_id, pids),
        ),
    [pids],
  );
  // Index related data by problem ID
  const answerRecordsMap = useMemo(
    () => groupBy(answerRecords, (it) => it.problem_id),
    [answerRecords],
  );

  const { data: answerAnalysises = [] } = useLiveQuery(
    (q) =>
      q
        .from({ answerAnalysisColl })
        .where(({ answerAnalysisColl }) =>
          inArray(answerAnalysisColl.problem_id, pids),
        ),
    [pids],
  );
  const answerAnalysisesMap = useMemo(
    () => groupBy(answerAnalysises, (it) => it.problem_id),
    [answerAnalysises],
  );

  const { data: problemExplanations = [] } = useLiveQuery(
    (q) =>
      q
        .from({ problemExplanationColl })
        .where(({ problemExplanationColl }) =>
          inArray(problemExplanationColl.problem_id, pids),
        ),
    [pids],
  );
  const { data: problemCount = { count: 0 } } = useLiveQuery((q) =>
    q
      .from({ problemColl })
      .select(({ problemColl }) => ({
        count: count(problemColl.id),
      }))
      .findOne(),
  );

  useEffect(() => {
    console.log(problemCount.count);
  }, [problemCount]);

  const problemExplanationsMap = useMemo(
    () => groupBy(problemExplanations, (it) => it.problem_id),
    [problemExplanations],
  );

  const { kgTopicsMap } = useChatKgTopics();

  const filtered = useMemo(() => {
    return problems;
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
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Loader2 className="animate-spin" />
            </EmptyMedia>
            <EmptyTitle>{t("common.loading")}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </Container>
    );
  }

  return (
    <Container>
      <ContainerHeader className="h-20 mt-10">
        <div className="flex h-full justify-between items-center">
          <div>
            <h1 className="text-3xl font-mono ">{t("problem.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("problem.subtitle")}
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">
              {problemCount.count}
            </span>
            {t("problem.total")}
          </p>
        </div>
      </ContainerHeader>

      <ContainerSticky className="flex items-center gap-1.5 flex-wrap">
        <div>
          <InputGroup className="max-w-xs">
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </ContainerSticky>
      <ContainerBody>
        {filtered.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileQuestion />
              </EmptyMedia>
              <EmptyTitle>{t("problem.title")}</EmptyTitle>
              <EmptyDescription>{t("problem.empty")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="py-5 flex flex-col gap-4">
              {filtered.map((p) => (
                <ProblemPreview
                  key={p.id}
                  problem={p}
                  answers={answerRecordsMap[p.id] ?? []}
                  answerAnalyses={answerAnalysisesMap[p.id] ?? []}
                  kgTopics={p.tags.map((id) => kgTopicsMap[id] ?? [])}
                  problemExplanations={problemExplanationsMap[p.id] ?? []}
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
