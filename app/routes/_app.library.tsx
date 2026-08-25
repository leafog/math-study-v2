import { useCallback, useEffect, useRef, useState } from "react";
import {
  eq,
  ilike,
  isNull,
  like,
  not,
  or,
  useLiveInfiniteQuery,
  type InferResultType,
  type InitialQueryBuilder,
  type QueryBuilder,
} from "@tanstack/react-db";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import { attachmentColl, attachmentMetaDataColl } from "~/db/tdb-collections";
import { FolderOpen, Loader2, X } from "lucide-react";
import {
  Container,
  ContainerHeader,
  ContainerBody,
  ContainerSticky,
} from "~/components/layout/Container";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { SearchInput } from "~/components/common-ui/search-input";
import { useDebounce, useIntersectionObserver } from "@uidotdev/usehooks";
import { Button } from "~/components/ui/button";
import { getFileCard } from "~/lib/file";
import ImageCard from "~/lib/file/file-ui/image-card";
import { useImmer } from "use-immer";
import { toast } from "sonner";
import { fileStore } from "~/db/indexdb-file-storage";
import {
  useActiveChat,
  useChatPromptInput,
} from "~/hooks/chat/active-chat/hooks";
import { useNavigate } from "react-router";

const PAGE_SIZE = 20;
const CARD_HEIGHT = 256; // h-64
const GRID_GAP = 16; // gap-4

/** 分类筛选：全部 / 图片 / 文件 */
type LibraryFilter = "all" | "image" | "file";

/** 查询构造器单独抽出，便于用 InferResultType 精确推导行类型 */
const buildLibraryQuery = (
  q: InitialQueryBuilder,
  search: string,
  filter: LibraryFilter,
) => {
  const base = q
    .from({ att: attachmentColl })
    .leftJoin({ attMeta: attachmentMetaDataColl }, ({ att, attMeta }) =>
      eq(att.id, attMeta.id),
    );

  // 分类过滤：图片是 media_type 以 image/ 开头；文件是排除图片
  const withType =
    filter === "all"
      ? base
      : base.where(({ att }) =>
          filter === "image"
            ? like(att.media_type, "image/%")
            : or(isNull(att.media_type), not(ilike(att.media_type, "image/%"))),
        );

  // 搜索为空时不过滤，返回全部；否则匹配标题或任务文本
  const withSearch =
    search.length > 0
      ? withType.where(({ attMeta }) =>
          or(
            ilike(attMeta.origin_filename, `%${search}%`),
            ilike(attMeta.last_task_text, `%${search}%`),
          ),
        )
      : withType;

  return withSearch
    .orderBy(({ att }) => att.timestamp, { direction: "desc" })
    .select(({ att, attMeta }) => ({
      ...att,
      meta_data: attMeta,
    }));
};

/** 一行的精确类型：Attachment & { meta_data: AttachmentMetaData | undefined } */
export type AttachmentRow = InferResultType<
  ReturnType<typeof buildLibraryQuery> extends QueryBuilder<infer C> ? C : never
>[number];

const Library = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const [filter, setFilter] = useState<LibraryFilter>("all");

  const {
    data = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useLiveInfiniteQuery(
    (q) => buildLibraryQuery(q, debouncedSearch, filter),
    { pageSize: PAGE_SIZE },
    [debouncedSearch, filter],
  );

  // data 已自带 Array<LibraryRow>，无需 cast；显式标注作文档
  const items: AttachmentRow[] = data;

  const [selecteds, setSelecteds] = useImmer(new Set<string>());

  // search 或 filter 变化时清空已选，避免保留看不见条目的选择状态
  useEffect(() => {
    setSelecteds((draft) => {
      draft.clear();
    });
  }, [debouncedSearch, filter]);

  // 单个稳定回调，避免每张卡片在每次渲染都新建一个方法
  const handleSelectedChange = useCallback((id: string, check: boolean) => {
    setSelecteds((draft) => {
      if (check) {
        draft.add(id);
      } else {
        draft.delete(id);
      }
    });
  }, []);

  // 批量下载选中的文件
  const handleDownloadSelected = async () => {
    const selectedRows = items.filter((it) => selecteds.has(it.id));
    for (const row of selectedRows) {
      const { filename = "", media_type = "application/octet-stream" } = row;
      if (!filename && !row.local_uri) continue;
      try {
        const bf = await fileStore.getFile(filename);
        const blob = new Blob([bf], { type: media_type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "attachment";
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        /* 单个失败跳过 */
      }
    }
    if (selectedRows.length > 0) {
      toast.success(t("attachment.downloadSuccess"), {
        position: "top-center",
      });
    }
  };

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

  const rowCount = Math.ceil(items.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT + GRID_GAP,
    overscan: 4,
  });

  // Infinite scroll
  const [sentinelRef, entry] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px",
  });

  // Only fire on the false -> true edge, so each scroll loads exactly one page
  // instead of cascading through all remaining pages at once.
  const addFileIds = useChatPromptInput().use.addFileIds();
  const { isNewChat } = useActiveChat();
  const lastIntersectingRef = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    const isIntersecting = entry?.isIntersecting ?? false;
    const crossed = isIntersecting && !lastIntersectingRef.current;
    lastIntersectingRef.current = isIntersecting;

    if (crossed && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const startChat = () => {
    if (isNewChat) {
      addFileIds([...selecteds]);
      navigate("/", {
        state: { fileIds: selecteds },
      });
    }
  };

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
          <div className="text-3xl font-mono">资料库</div>
          <div>
            <SearchInput value={search} onChange={setSearch} />
          </div>
        </div>
      </ContainerHeader>

      <ContainerSticky className="flex items-center justify-between">
        {selecteds.size > 0 ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 开始聊天：占位，暂无逻辑 */}
              <Button size="lg" onClick={startChat}>
                {t("library.startChat")}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={handleDownloadSelected}
              >
                {t("attachment.download")}
              </Button>
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
              variant={filter === "all" ? "secondary" : "ghost"}
              onClick={() => setFilter("all")}
            >
              {t("library.filter.all")}
            </Button>
            <Button
              size="lg"
              variant={filter === "image" ? "secondary" : "ghost"}
              onClick={() => setFilter("image")}
            >
              {t("library.filter.image")}
            </Button>
            <Button
              size="lg"
              variant={filter === "file" ? "secondary" : "ghost"}
              onClick={() => setFilter("file")}
            >
              {t("library.filter.file")}
            </Button>
          </div>
        )}
      </ContainerSticky>

      <ContainerBody>
        {items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>资料库</EmptyTitle>
              <EmptyDescription>{t("library.empty")}</EmptyDescription>
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
                  const rowItems = items.slice(start, start + columns);
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
                      {rowItems.map((it) => {
                        const Card = getFileCard(it.media_type) ?? ImageCard;
                        return (
                          <Card
                            key={it.id}
                            row={it}
                            selected={selecteds.has(it.id)}
                            onSelectedChange={handleSelectedChange}
                          />
                        );
                      })}
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
    </Container>
  );
};

export default Library;
