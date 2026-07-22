import { useState, useEffect, useCallback, useRef } from "react";
import { useLiveInfiniteQuery } from "@tanstack/react-db";
import { attachmentColl } from "~/db/tdb-collections";
import { FileIcon, ImageIcon } from "lucide-react";
import { fileStore } from "~/db/indexdb-file-storage";

const PAGE_SIZE = 20;

function formatSize(bytes?: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({ item }: { item: Record<string, unknown> }) {
  const id = item.id as string;
  const mediaType = item.media_type as string | undefined;
  const localUri = item.local_uri as string | undefined;
  const filename = (item.filename as string | undefined) ?? "unnamed";
  const size = item.size as number | undefined;
  const isImage = !!mediaType?.startsWith("image/");

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!localUri || !isImage) return;
    let cancelled = false;
    fileStore.getUrl(localUri, mediaType).then((url) => {
      if (!cancelled) setBlobUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [localUri, mediaType, isImage]);

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/50">
      {/* 缩略图区 */}
      <div className="aspect-square overflow-hidden bg-muted">
        {isImage && blobUrl ? (
          <img
            src={blobUrl}
            alt={filename}
            className="size-full object-cover transition-all group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            {isImage ? (
              <ImageIcon className="size-8 text-muted-foreground/40" />
            ) : (
              <FileIcon className="size-8 text-muted-foreground/40" />
            )}
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="px-2.5 py-2">
        <p className="truncate text-sm font-medium">{filename}</p>
        {size != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatSize(size)}
          </p>
        )}
      </div>
    </div>
  );
}

const Library = () => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useLiveInfiniteQuery(
      (q) =>
        q
          .from({ attachmentColl })
          .orderBy(({ attachmentColl: col }) => col.timestamp, {
            direction: "desc",
          }),
      { pageSize: PAGE_SIZE },
    );

  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "400px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col ">
      <div className="mb-4 shrink-0 px-6 pt-6">
        <h1 className="text-xl font-bold">文件库</h1>
        <p className="text-sm text-muted-foreground">
          共 {data?.length ?? 0} 个文件
        </p>
      </div>

      {!data?.length ? (
        <p className="text-sm text-muted-foreground">暂无文件</p>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {data.map((item) => (
              <FileCard key={item.id} item={item} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              加载更多...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;
