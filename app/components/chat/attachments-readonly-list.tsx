import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTrigger,
} from "../ui/attachment";
import { bus } from "~/event/event-bus";
import IndexedUrlPreview, {
  type AttachmentWithMetaData,
} from "../common-ui/indexed-url-preview";
import type { z } from "zod";

const AttachmentItemMedia = ({
  attachment,
}: {
  attachment: AttachmentWithMetaData;
}) => {
  return (
    <>
      <AttachmentMedia key={attachment.id}>
        <IndexedUrlPreview attachment={attachment} />
      </AttachmentMedia>
      <AttachmentTrigger
        onClick={(e) => {
          bus.emit("open:tool", {
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
    <AttachmentGroup>
      {attachments.map((it) => (
        <Attachment
          key={it.id}
          orientation="vertical"
          className="focus-within:ring-0"
        >
          <AttachmentItemMedia attachment={it}></AttachmentItemMedia>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
};

export default AttachmentsReadonlyList;
