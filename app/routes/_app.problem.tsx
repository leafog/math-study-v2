import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  count,
  eq,
  inArray,
  like,
  or,
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
import { useActiveChat, useChatKgTopics } from "~/hooks/chat/active-chat";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
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
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { type ProblemStatus } from "~/components/math/constants";
import ProblemCard from "~/components/math/problem/problem-card";
import StatusIcon from "~/components/math/status-icon";
import ProblemDetailDialog from "~/components/math/problem/problem-detail-dialog";

const PAGE_SIZE = 20;
const CARD_HEIGHT = 256; // h-64
const GRID_GAP = 16; // gap-4
// 不鼓励一次带太多题目去聊天，最多三道
const MAX_PRACTICE_PROBLEMS = 3;

const ProblemIndex = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<"all" | ProblemStatus>("all");
  const [activeProblem, setActiveProblem] = useState<ProblemType | null>(null);
  const [selecteds, setSelecteds] = useState(() => new Set<string>());
  const addProblemIds = useChatPromptInput().use.addProblemIds();
  const { isNewChat } = useActiveChat();
  const navigate = useNavigate();

  // search 或 status 变化时清空已选，避免保留看不见条目的选择状态
  useEffect(() => {
    setSelecteds(new Set());
  }, [debouncedSearch, status]);

  // 单个稳定回调，避免每张卡片在每次渲染都新建一个方法
  const handleSelectedChange = useCallback((id: string, checked: boolean) => {
    setSelecteds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // 用选中的题目开始聊天：把 id 写入 prompt 输入草稿后跳到聊天
  // 最多带 MAX_PRACTICE_PROBLEMS 道题，超限禁用（不鼓励一次聊太多题）
  const startChat = () => {
    if (isNewChat && selecteds.size <= MAX_PRACTICE_PROBLEMS) {
      addProblemIds([...selecteds]);
      navigate("/", {
        state: { problemIds: [...selecteds] },
      });
    }
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLiveInfiniteQuery(
      (q) => {
        const base = q
          .from({ problemColl })
          .where(({ problemColl }) =>
            or(
              like(problemColl.content, `%${debouncedSearch}%`),
              like(problemColl.description, `%${debouncedSearch}%`),
            ),
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

      <ContainerSticky className="flex items-center justify-between flex-wrap">
        {selecteds.size > 0 ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button
                      size="lg"
                      disabled={selecteds.size > MAX_PRACTICE_PROBLEMS}
                      onClick={startChat}
                    >
                      {t("problem.startChat")}
                    </Button>
                  </span>
                </TooltipTrigger>
                {selecteds.size > MAX_PRACTICE_PROBLEMS && (
                  <TooltipContent>
                    {t("problem.startChatLimit", {
                      count: MAX_PRACTICE_PROBLEMS,
                    })}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t("library.selected", { count: selecteds.size })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelecteds(new Set<string>())}
                title={t("library.clearSelection")}
              >
                <X />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              size="lg"
              variant={status === "all" ? "secondary" : "ghost"}
              onClick={() => setStatus("all")}
            >
              {t("problem.status.all")}
            </Button>
            <Button
              size="lg"
              variant={status === "unanswered" ? "secondary" : "ghost"}
              onClick={() => setStatus("unanswered")}
            >
              <StatusIcon status="unanswered" />
              {t("problem.status.unanswered")}
            </Button>
            <Button
              size="lg"
              variant={status === "correct" ? "secondary" : "ghost"}
              onClick={() => setStatus("correct")}
            >
              <StatusIcon status="correct" />
              {t("problem.status.correct")}
            </Button>
            <Button
              size="lg"
              variant={status === "incorrect" ? "secondary" : "ghost"}
              onClick={() => setStatus("incorrect")}
            >
              <StatusIcon status="incorrect" />
              {t("problem.status.incorrect")}
            </Button>
          </div>
        )}
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
                          selected={selecteds.has(p.id)}
                          onSelectedChange={handleSelectedChange}
                          onViewDetail={setActiveProblem}
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
