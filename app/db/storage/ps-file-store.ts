import { AttachmentQueue } from "@powersync/web";
import QuickLRU from "quick-lru";

import type { FileEntry, FileMeta, FileStore } from "./types";

const fileLRU = new QuickLRU<string, string>({
  maxSize: 1000,
  onEviction(key, value) {
    URL.revokeObjectURL(value);
  },
});

/**
 * PowerSync-backed FileStore 实现。
 *
 * - 文件体存入 IndexedDB（通过 AttachmentQueue 的 localStorage adapter）
 * - 元数据存入 PowerSync attachments 表
 * - Blob URL 用 LRU 缓存（fileLRU），重复 getUrl 直接命中，淘汰时自动 revoke
 */
export class PowerSyncFileStore implements FileStore {
  constructor(private readonly queue: AttachmentQueue) {}

  async save(file: File, id: string, metaData?: string): Promise<FileEntry> {
    const ext = file.name.split(".").pop() ?? "";
    const data = await file.arrayBuffer();

    const record = await this.queue.saveFile({
      id,
      metaData,
      data,
      fileExtension: ext,
      mediaType: file.type || "application/octet-stream",
    });

    const mediaType =
      record.mediaType ?? (file.type || "application/octet-stream");
    const meta: FileMeta = {
      id: record.id,
      filename: record.filename,
      mediaType,
      size: record.size ?? file.size,
      createdAt: new Date(),
    };

    return { meta, url: record.localUri ?? "" };
  }
  async getFile(filename: string): Promise<ArrayBuffer> {
    const uri = this.queue.localStorage.getLocalUri(filename);
    const bf = await this.queue.localStorage.readFile(uri);
    return bf;
  }

  async getUrl(
    uri: string,
    opts?: { force?: boolean },
  ): Promise<string> {
    // 一个文件一条缓存：同一 uri 复用同一个 Blob URL；
    // force 时绕过缓存,用于缓存里的 URL 已被 revoke、需要重建的场景
    const cached = opts?.force ? undefined : fileLRU.get(uri);
    if (cached) {
      return cached;
    }

    const bf = await this.queue.localStorage.readFile(uri);
    const url = URL.createObjectURL(new Blob([bf]));
    // 若缓存里有一条旧的(可能已被外部 revoke),回收它,避免泄漏
    const stale = fileLRU.get(uri);
    if (stale && stale !== url) {
      URL.revokeObjectURL(stale);
    }
    fileLRU.set(uri, url);
    return url;
  }

  async delete(id: string): Promise<void> {
    await this.queue.deleteFile({ id });
  }
}
