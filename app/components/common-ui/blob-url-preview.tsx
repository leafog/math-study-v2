import type { FileUIPart } from "ai";
import { parse } from "media-typer";
import { FileIcon } from "lucide-react";
import { fileIcons, getFileType } from "~/lib/file";

const BlobUrlPreview = ({ file }: { file: FileUIPart & { id: string } }) => {
  const { url, mediaType, filename } = file;
  const media = parse(mediaType);

  if (media.type === "image" && url.length > 0)
    return <img src={url} alt={filename ?? ""}></img>;

  const fileType = getFileType(mediaType);
  const Icon = fileType ? (fileIcons[fileType] ?? FileIcon) : FileIcon;
  return <Icon className="size-6 shrink-0" />;
};

export default BlobUrlPreview;
