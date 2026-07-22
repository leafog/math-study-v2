import { AttachmentQueue } from "@powersync/web";

import type { FileEntry, FileMeta, FileStore } from "./types";

/**
 * PowerSync-backed FileStore 实现。
 *
 * - 文件体存入 IndexedDB（通过 AttachmentQueue 的 localStorage adapter）
 * - 元数据存入 PowerSync attachments 表
 * - Blob URL 内存缓存，避免重复读取和创建
 */
export class PowerSyncFileStore implements FileStore {
  /** local_uri → Blob URL 缓存 */
  private readonly urlCache = new Map<string, string>();

  constructor(private readonly queue: AttachmentQueue) {}

  async save(file: File): Promise<FileEntry> {
    const ext = file.name.split(".").pop() ?? "";
    const data = await file.arrayBuffer();

    const record = await this.queue.saveFile({
      data,
      fileExtension: ext,
      mediaType: file.type || "application/octet-stream",
    });
    const mediaType =
      record.mediaType ?? (file.type || "application/octet-stream");
    const meta: FileMeta = {
      id: record.id,
      name: file.name,
      mediaType,
      size: record.size ?? file.size,
      createdAt: new Date(),
    };

    return { meta, url: record.localUri ?? "" };
  }

  async getUrl(uri: string, mediaType?: string): Promise<string> {
    const cached = this.urlCache.get(uri);
    if (cached) return cached;

    const bf = await this.queue.localStorage.readFile(uri);

    const url = URL.createObjectURL(
      new Blob([bf], { type: mediaType ?? "application/octet-stream" }),
    );
    this.urlCache.set(uri, url);
    return url;
  }

  async delete(id: string): Promise<void> {
    for (const [key, url] of this.urlCache) {
      if (key.includes(id)) {
        URL.revokeObjectURL(url);
        this.urlCache.delete(key);
      }
    }
    await this.queue.deleteFile({ id });
  }
}
