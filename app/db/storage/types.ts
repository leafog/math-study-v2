/** 文件元数据 */
export interface FileMeta {
  id: string;
  filename: string;
  mediaType: string;
  size: number;
  createdAt: Date;
}

export interface FileEntry {
  meta: FileMeta;
  url: string;
}

export interface FileStore {
  save(file: File, id: string, metaData?: string): Promise<FileEntry>;

  /**
   * 取文件的 blob URL(带 LRU 缓存)。
   * opts.force 为 true 时绕过缓存强制重建:用于缓存里的 URL 已被 revoke 的场景,
   * 会回收旧的失效 URL 并写入新 URL。
   */
  getUrl(uri: string, opts?: { force?: boolean }): Promise<string>;

  delete(id: string): Promise<void>;
  getFile(filename: string): Promise<ArrayBuffer>;
}
