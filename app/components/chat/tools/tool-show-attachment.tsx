import { attachmentColl, attachmentMetaDataColl } from "~/db/tdb-collections";
import type { ToolPanelProps } from "./types";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { IndexedUrlImage } from "~/components/common-ui/indexed-url-preview";

const ShowAttachmentPanel = ({ chatId, id, refId }: ToolPanelProps) => {
  const { data: att } = useLiveQuery(
    (q) =>
      q
        .from({ att: attachmentColl })
        .join({ attmeta: attachmentMetaDataColl }, ({ att, attmeta }) =>
          eq(att.id, attmeta.id),
        )
        .where(({ att }) => eq(att.id, refId))
        .select(({ att, attmeta }) => ({
          ...att,
          meta_data: attmeta,
        }))
        .findOne(),
    [refId],
  );
  return (
    <div className="size-full bg-red-50">
      {att?.local_uri && (
        <IndexedUrlImage
          src={att.local_uri}
          alt={att?.meta_data?.origin_filename ?? ""}
        />
      )}
    </div>
  );
};

export default ShowAttachmentPanel;
