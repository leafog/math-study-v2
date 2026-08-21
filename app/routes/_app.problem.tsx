import { useMemo, useEffect, useState, useRef } from "react";
import {
  count,
  eq,
  inArray,
  like,
  useLiveInfiniteQuery,
  useLiveQuery,
} from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { groupBy } from "lodash-es";
import { FileQuestion, Loader2, Search, X } from "lucide-react";
import {
  problemColl,
  problemChatRelColl,
  answerRecordColl,
  answerAnalysisColl,
  problemExplanationColl,
  conversationColl,
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
import { SearchInput } from "~/components/common-ui/search-input";
import { useDebounce, useIntersectionObserver } from "@uidotdev/usehooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type ProblemStatus } from "~/components/math/constants";
import ProblemCard from "~/components/math/problem/problem-card";
import StatusIcon from "~/components/math/status-icon";
import ProblemDetailDialog from "~/components/math/problem/problem-detail-dialog";

const PAGE_SIZE = 20;
const CARD_HEIGHT = 256; // h-64
const GRID_GAP = 16; // gap-4

const ProblemIndex = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<"all" | ProblemStatus>("all");
  const [activeProblem, setActiveProblem] = useState<ProblemType | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLiveInfiniteQuery(
      (q) => {
        const base = q
          .from({ problemColl })
          .where(({ problemColl }) =>
            like(problemColl.content, `%${debouncedSearch}%`),
          );
        const withStatus =
          status === "all"
            ? base
            : base.where(({ problemColl }) => eq(problemColl.status, status));
        return withStatus.orderBy(({ problemColl: col }) => col.created_at, {
          direction: "desc",
        });
      },
      { pageSize: PAGE_SIZE },
      [debouncedSearch, status],
    );

  const problems = (data ?? []) as ProblemType[];
  const pids = useMemo(() => problems.map((it) => it.id), [problems]);

  // Responsive column count, matched to the grid's md/xl breakpoints.
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined"
      ? 1
      : window.innerWidth >= 1280
        ? 3
        : window.innerWidth >= 768
          ? 2
          : 1,
  );

  useEffect(() => {
    const onResize = () =>
      setColumns(
        window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1,
      );
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // The outer Container is the scroll element.
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(problems.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT + GRID_GAP,
    overscan: 4,
  });
  const isScrolling = rowVirtualizer.isScrolling;
  const visibleRowRangeKey = rowVirtualizer
    .getVirtualItems()
    .map((item) => item.index)
    .join(",");

  const visiblePids = useMemo(() => {
    const pids = new Set<string>();
    for (const item of rowVirtualizer.getVirtualItems()) {
      const start = item.index * columns;
      for (let c = 0; c < columns; c++) {
        const p = problems[start + c];
        if (p) pids.add(p.id);
      }
    }
    return [...pids];
  }, [visibleRowRangeKey, problems, columns]);

  const { data: problemChatInfo } = useLiveQuery(
    (q) => {
      if (isScrolling) return;
      return q
        .from({ problemChatRelColl })
        .join(
          { conversationColl },
          ({ problemChatRelColl, conversationColl }) =>
            eq(problemChatRelColl.chat_id, conversationColl.id),
          "inner",
        )
        .where(({ problemChatRelColl }) =>
          inArray(problemChatRelColl.pid, pids),
        )
        .select(({ problemChatRelColl, conversationColl }) => ({
          pid: problemChatRelColl.pid,
          chat_id: problemChatRelColl.chat_id,
          title: conversationColl.title,
        }));
    },
    [visiblePids, isScrolling],
  );
  const problemChatInfoMap = useMemo(
    () => groupBy(problemChatInfo, (it) => it.pid),
    [problemChatInfo],
  );
  // Bulk queries for related data
  const { data: answerRecords = [] } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl }) =>
          inArray(answerRecordColl.problem_id, visiblePids),
        ),
    [visiblePids],
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
          inArray(answerAnalysisColl.problem_id, visiblePids),
        ),
    [visiblePids],
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
          inArray(problemExplanationColl.problem_id, visiblePids),
        ),
    [visiblePids],
  );
  const { data: problemCount = { count: 0 } } = useLiveQuery((q) =>
    q
      .from({ problemColl })
      .select(({ problemColl }) => ({
        count: count(problemColl.id),
      }))
      .findOne(),
  );

  const problemExplanationsMap = useMemo(
    () => groupBy(problemExplanations, (it) => it.problem_id),
    [problemExplanations],
  );

  const { kgTopicsMap } = useChatKgTopics();

  // Infinite scroll
  const [sentinelRef, entry] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px",
  });

  // Only fire on the false -> true edge, so each scroll loads exactly one page
  // instead of cascading through all remaining pages at once.
  const lastIntersectingRef = useRef(false);

  useEffect(() => {
    const isIntersecting = entry?.isIntersecting ?? false;
    const crossed = isIntersecting && !lastIntersectingRef.current;
    lastIntersectingRef.current = isIntersecting;

    if (crossed && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    <Container ref={scrollRef}>
      <ContainerHeader className="h-20 mt-10">
        <div className="flex h-full justify-between items-center">
          <div>
            <h1 className="text-3xl font-mono ">{t("problem.title")}</h1>
          </div>
          <div>
            <SearchInput value={search} onChange={setSearch} />
          </div>
        </div>
      </ContainerHeader>

      <ContainerSticky className="flex items-center gap-1.5 flex-wrap">
        <div>
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as "all" | ProblemStatus)}
          >
            <TabsList>
              <TabsTrigger value="all">{t("problem.status.all")}</TabsTrigger>
              <TabsTrigger value="unanswered">
                <StatusIcon status="unanswered" />
                {t("problem.status.unanswered")}
              </TabsTrigger>
              <TabsTrigger value="correct">
                <StatusIcon status="correct" />
                {t("problem.status.correct")}
              </TabsTrigger>
              <TabsTrigger value="incorrect">
                <StatusIcon status="incorrect" />
                {t("problem.status.incorrect")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </ContainerSticky>
      <ContainerBody>
        {problems.length === 0 ? (
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
            <div className="py-2">
              <div
                className="relative w-full"
                style={{ height: rowVirtualizer.getTotalSize() }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const start = virtualRow.index * columns;
                  const rowItems = problems.slice(start, start + columns);
                  return (
                    <div
                      key={virtualRow.key}
                      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {rowItems.map((p) => (
                        <ProblemCard
                          problem={p}
                          key={p.id}
                          inChats={problemChatInfoMap[p.id]}
                          onCardContentClick={setActiveProblem}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
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

      <ProblemDetailDialog
        problem={activeProblem}
        inChats={activeProblem?.id ? problemChatInfoMap[activeProblem.id] : []}
        onClose={() => setActiveProblem(null)}
      />
    </Container>
  );
};

export default ProblemIndex;
