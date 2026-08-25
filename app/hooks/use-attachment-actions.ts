import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { fileStore } from "~/db/indexdb-file-storage";
import { attachmentMetaDataColl } from "~/db/tdb-collections";
import type { AttachmentRow } from "~/routes/_app.library";

const useAttachmentActions = (row: AttachmentRow) => {
  const { t } = useTranslation();

  const download = async () => {
    const { filename = "", media_type = "application/octet-stream" } = row;
    if (!filename && !row.local_uri) {
      toast.error(t("attachment.noFile"), { position: "top-center" });
      return;
    }
    try {
      // 用 filename 取字节，自建 Blob URL 走一次下载，用完即 revoke，
      // 避免污染 fileStore.getUrl 的 LRU 缓存。
      const bf = await fileStore.getFile(filename);
      const blob = new Blob([bf], { type: media_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "attachment";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("attachment.downloadSuccess"), {
        position: "top-center",
      });
    } catch {
      toast.error(t("attachment.noFile"), { position: "top-center" });
    }
  };
  const rename = (newFileName: string) => {
    const inDb = attachmentMetaDataColl.get(row.id);
    if (inDb) {
      attachmentMetaDataColl.update(row.id, (draft) => {
        draft.origin_filename = newFileName;
      });
    } else {
      // 元数据不存在时插入一条新记录
      attachmentMetaDataColl.insert({
        id: row.id,
        origin_filename: newFileName,
      });
    }
  };

  const remove = async () => {
    await fileStore.delete(row.id);
  };

  return { download, remove, rename };
};

export default useAttachmentActions;
