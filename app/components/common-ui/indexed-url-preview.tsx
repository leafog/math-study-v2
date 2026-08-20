import { AttachmentMetaDataSchema, type Attachment } from "~/db/db-zod-schema";
import * as typer from "media-typer";
import { Empty } from "../ui/empty";
import { fileStore } from "~/db/indexdb-file-storage";
import { useEffect, useMemo, useState } from "react";

const IndexedUrlImage = ({ src, alt }: { src: string; alt: string }) => {
  const [realSrc, setRealSrc] = useState("");
  useEffect(() => {
    fileStore.getUrl(src).then((it) => {
      setRealSrc(it);
    });
  }, [src]);

  return <img src={realSrc} alt={alt}></img>;
};

const IndexedUrlPreview = ({ attachment }: { attachment: Attachment }) => {
  const { local_uri = "", media_type = "", meta_data = "{}" } = attachment;
  const { filename, ocr_result } = useMemo(
    () => AttachmentMetaDataSchema.parse(JSON.parse(meta_data)),
    [meta_data],
  );
  console.log(meta_data);
  const p = typer.parse(media_type);

  if (local_uri === "") {
    return <Empty />;
  }
  if (p.type === "image")
    return <IndexedUrlImage src={local_uri} alt={filename} />;
};

export default IndexedUrlPreview;
