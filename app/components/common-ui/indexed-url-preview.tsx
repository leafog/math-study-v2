import { AttachmentMetaDataSchema, AttachmentSchema } from "~/db/db-zod-schema";
import * as typer from "media-typer";
import { Empty } from "../ui/empty";
import { fileStore } from "~/db/indexdb-file-storage";
import { useEffect, useState } from "react";
import type z from "zod";

export const AttachmentWithMetaDataSchema = AttachmentSchema.extend({
  meta_data: AttachmentMetaDataSchema.optional(),
});
export type AttachmentWithMetaData = z.infer<
  typeof AttachmentWithMetaDataSchema
>;
export const IndexedUrlImage = ({ src, alt }: { src: string; alt: string }) => {
  const [realSrc, setRealSrc] = useState("");
  useEffect(() => {
    fileStore.getUrl(src).then((it) => {
      setRealSrc(it);
    });
  }, [src]);

  if (realSrc.length === 0) {
    return null;
  }
  return <img src={realSrc} alt={alt}></img>;
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
