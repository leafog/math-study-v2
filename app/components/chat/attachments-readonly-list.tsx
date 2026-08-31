import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "../ui/attachment";
import { bus } from "~/event/events";
import IndexedUrlPreview, {
  type AttachmentWithMetaData,
} from "../common-ui/indexed-url-preview";
import { FileType, fileIcons, getFileType } from "~/lib/file";
import { FileIcon } from "lucide-react";

const AttachmentItemMedia = ({
  attachment,
}: {
  attachment: AttachmentWithMetaData;
}) => {
  const fileType = getFileType(attachment.media_type ?? "");
  // 图片直接预览；其余按类别显示图标（无法归类回退通用文件图标）
  const Icon = fileType ? (fileIcons[fileType] ?? FileIcon) : FileIcon;

  return (
    <>
      <AttachmentMedia key={attachment.id}>
        {fileType === FileType.Image ? (
          <IndexedUrlPreview attachment={attachment} />
        ) : (
          <Icon className="size-6 shrink-0" />
        )}
      </AttachmentMedia>
      <AttachmentTrigger
        onClick={(e) => {
          bus.emit("open:tool:by-ref-id", {
            kind: "showAttachment",
            refId: attachment.id,
            title: attachment?.meta_data?.origin_filename ?? "",
          });
        }}
      ></AttachmentTrigger>
    </>
  );
};
const AttachmentsReadonlyList = ({
  attachments,
}: {
  attachments: AttachmentWithMetaData[];
}) => {
  return (
    <AttachmentGroup className="w-full overflow-scroll">
      {attachments.map((it, idx) => (
        <Attachment
          key={`${it.id}-${idx}`}
          className="focus-within:ring-0"
          orientation={"vertical"}
          size={"default"}
        >
          <AttachmentItemMedia attachment={it}></AttachmentItemMedia>
          <AttachmentContent>
            <AttachmentTitle>{it.meta_data?.origin_filename}</AttachmentTitle>
          </AttachmentContent>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
};

export default AttachmentsReadonlyList;
