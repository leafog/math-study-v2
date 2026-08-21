import type { FileUIPart } from "ai";
import { parse } from "media-typer";

const BlobUrlPreview = ({ file }: { file: FileUIPart & { id: string } }) => {
  const { url, mediaType, filename } = file;
  const media = parse(mediaType);

  if (media.type === "image" && url.length > 0)
    return <img src={url} alt={filename ?? ""}></img>;
  return <div>{mediaType}</div>;
};

export default BlobUrlPreview;
