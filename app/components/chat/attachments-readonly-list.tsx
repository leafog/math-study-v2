import type { Attachment as AttachmentSchema } from "~/db/db-zod-schema";

import { fileStore } from "~/db/indexdb-file-storage";
import { useEffect, useState } from "react";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTrigger,
} from "../ui/attachment";
import { bus } from "~/event/event-bus";
import IndexedUrlPreview from "../common-ui/indexed-url-preview";

const AttachmentItemMedia = ({
  attachment,
}: {
  attachment: AttachmentSchema;
}) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!attachment.local_uri) return;
    fileStore.getUrl(attachment.local_uri).then((it) => {
      setUrl(it);
    });
  }, [attachment.local_uri]);

  return (
    <>
      <AttachmentMedia key={attachment.id}>
        <IndexedUrlPreview attachment={attachment} />
      </AttachmentMedia>
      <AttachmentTrigger
        onClick={(e) => {
          console.log(attachment.id);
          bus.emit("image:show-light-box", attachment.id);
        }}
      ></AttachmentTrigger>
    </>
  );
};
const AttachmentsReadonlyList = ({
  attachments,
}: {
  attachments: AttachmentSchema[];
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
