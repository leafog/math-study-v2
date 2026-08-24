import { AttachmentMetaDataSchema, AttachmentSchema } from "~/db/db-zod-schema";
import * as typer from "media-typer";
import { Empty } from "../ui/empty";
import { fileStore } from "~/db/indexdb-file-storage";
import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type RefObject,
} from "react";
import type z from "zod";
import { withRef } from "~/lib/ref-utils";
import { useMeasure } from "@uidotdev/usehooks";
import { useResizeObserver } from "usehooks-ts";

export const AttachmentWithMetaDataSchema = AttachmentSchema.extend({
  meta_data: AttachmentMetaDataSchema.optional(),
});
export type AttachmentWithMetaData = z.infer<
  typeof AttachmentWithMetaDataSchema
>;

type IndexedUrlImageProps = ComponentProps<"img">;

// blob: URL 可能在 LRU 淘汰时被 revoke,img 会触发 error。
// 最大重试次数,防止文件真被删掉时无限刷新。
const MAX_RELOAD = 2;

export const IndexedUrlImage = ({
  src,
  alt,
  onNatureChange,
  ...rest
}: IndexedUrlImageProps & {
  onNatureChange?: (n: { w: number; h: number }) => void;
}) => {
  const [realSrc, setRealSrc] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    if (src) {
      // reload > 0 表示上一张 blob URL 已失效,force 强制重建一个新鲜的
      fileStore.getUrl(src, { force: reload > 0 }).then((it) => {
        if (alive) setRealSrc(it);
      });
    }
    return () => {
      alive = false;
    };
  }, [src, reload]);

  // src 切换时重置重试计数
  useEffect(() => {
    setReload(0);
  }, [src]);

  const handleError = () => {
    // blob URL 被 revoke → 判定失效,重新取一个有效 URL;最多重试 MAX_RELOAD 次
    setReload((r) => (r < MAX_RELOAD ? r + 1 : r));
  };

  const [nature, setNature] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  useEffect(() => {
    onNatureChange?.(nature);
  }, [nature]);

  const ref = useRef<HTMLImageElement>(null);
  const { width = 0, height = 0 } = useResizeObserver({
    ref: ref as RefObject<HTMLDivElement>,
    box: "content-box",
  });

  useEffect(() => {
    withRef(ref, (it) => {
      setNature({ w: it.naturalWidth, h: it.naturalHeight });
    });
  }, [ref.current]);

  if (realSrc.length === 0) {
    return null;
  }

  return (
    <img
      ref={ref}
      src={realSrc}
      alt={alt}
      onError={handleError}
      {...rest}
      className="bg-red-200"
    />
  );
};

const IndexedUrlPreview = ({
  attachment,
}: {
  attachment: AttachmentWithMetaData;
}) => {
  const { local_uri = "", media_type = "", meta_data = "{}" } = attachment;

  const p = typer.parse(media_type);

  if (local_uri === "") {
    return <Empty />;
  }
  if (p.type === "image")
    return (
      <IndexedUrlImage
        src={local_uri}
        alt={attachment?.meta_data?.origin_filename ?? ""}
      />
    );
};

export default IndexedUrlPreview;
