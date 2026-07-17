import { AttachmentQueue } from "@powersync/web";

import type { FileEntry, FileMeta, FileStore } from "./types";
import { attachmentColl } from "../tdb-collections";

/**
 * PowerSync-backed FileStore 实现。
 *
 * - 文件体存入 IndexedDB（通过 AttachmentQueue 的 localStorage adapter）
 * - 元数据存入 PowerSync attachments 表
 * - 读文件时从 IndexedDB 取数据，通过 URL.createObjectURL 生成可消费 URL
 */
export class PowerSyncFileStore implements FileStore {
  constructor(private readonly queue: AttachmentQueue) {}

  async save(file: File): Promise<FileEntry> {
    const ext = file.name.split(".").pop() ?? "";
    const data = await file.arrayBuffer();

    const record = await this.queue.saveFile({
      data,
      fileExtension: ext,
      mediaType: file.type || "application/octet-stream",
    });
    console.log(record.localUri);

    const meta: FileMeta = {
      id: record.id,
      name: file.name,
      mediaType: record.mediaType ?? (file.type || "application/octet-stream"),
      size: record.size ?? file.size,
      createdAt: new Date(),
    };

    return { meta, url: record.localUri ?? "" };
  }

  async getUrl(id: string): Promise<string> {
    const bf = await this.queue.localStorage.readFile(id);
    // todo 转换真正的 地址
    return "";
  }

  async delete(id: string): Promise<void> {
    await this.queue.deleteFile({ id });
  }
}
