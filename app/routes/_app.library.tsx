import { useState, useEffect, useCallback, useRef } from "react";
import { useLiveInfiniteQuery } from "@tanstack/react-db";
import { useTranslation } from "react-i18next";
import { attachmentColl } from "~/db/tdb-collections";
import { FileIcon, ImageIcon, FolderOpen, Loader2 } from "lucide-react";
import { fileStore } from "~/db/indexdb-file-storage";
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
import { Input } from "~/components/ui/input";

const PAGE_SIZE = 20;

function formatSize(bytes?: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({ item }: Readonly<{ item: Record<string, unknown> }>) {
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
    fileStore.getUrl(localUri).then((url) => {
      if (!cancelled) setBlobUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [localUri, mediaType, isImage]);

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-colors hover:bg-accent/50">
      <div className="aspect-square overflow-hidden bg-muted">
        {isImage && blobUrl ? (
          <img
            src={blobUrl}
            alt={filename}
            className="size-full object-cover transition-transform group-hover:scale-105"
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
  const { t } = useTranslation();
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
        <div className="flex h-full justify-between items-center align-middle">
          <div className="text-3xl font-mono">资料库</div>
          <div>
            <Input />
          </div>
        </div>
      </ContainerHeader>
      <ContainerSticky className="flex items-center  justify-between align-middle">
        <div className="bg-red-50">
          <span className="h-full">123</span>
        </div>
      </ContainerSticky>
      <ContainerBody>
        {!data?.length ? (
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
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((item) => (
                  <FileCard key={item.id} item={item} />
                ))}
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
