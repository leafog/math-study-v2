import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLiveInfiniteQuery } from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { FileQuestion } from "lucide-react";
import Problem from "~/components/math/problem";
import { cn } from "~/lib/utils";
import { problemColl } from "~/db/tdb-collections";
import type { Problem as ProblemType } from "~/db/db-zod-schema";
import {
  Container,
  ContainerHeader,
  ContainerSticky,
  ContainerBody,
} from "~/components/layout/Container";

const PAGE_SIZE = 20;

const sources = [
  { key: "photo", icon: "📷", label: "Photo" },
  { key: "latex", icon: "📝", label: "LaTeX" },
  { key: "batch", icon: "📦", label: "Batch" },
  { key: "ai", icon: "🤖", label: "AI" },
  { key: "manual", icon: "✍️", label: "Manual" },
] as const;

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
        {sources.map(({ key, icon, label }) => {
          const active = filterSource === key;
          return (
            <button
              key={key}
              onClick={() => setFilterSource(active ? null : key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                active
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              <span>{icon}</span>
              {label}
              <span
                className={cn(
                  "tabular-nums",
                  active ? "opacity-50" : "opacity-40",
                )}
              >
                {sourceCounts[key] ?? 0}
              </span>
            </button>
          );
        })}
        {filterSource && (
          <button
            onClick={() => setFilterSource(null)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded"
          >
            {t("problem.clearFilter")}
          </button>
        )}
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
                <Problem
                  key={p.id}
                  content={p.content}
                  description={p.description}
                  source={p.source}
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
