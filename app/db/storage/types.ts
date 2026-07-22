/** 文件元数据 */
export interface FileMeta {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  createdAt: Date;
}

/** 文件完整条目（元数据 + 可直接消费的 URL） */
export interface FileEntry {
  meta: FileMeta;
  /** blob: URL，直接用于 <img src> / <a href> 等 */
  url: string;
}

/**
 * 文件存储隔离接口。
 *
 * 换存储后端时只需重新实现此接口的方法，
 * 调用方代码无需改动。
 */
export interface FileStore {
  /** 保存文件，返回带可消费 URL 的条目 */
  save(file: File): Promise<FileEntry>;

  /**
   * 根据 IndexedDB 文件路径获取可消费的 blob URL。
   * URL 在页面刷新前一直有效，组件卸载时浏览器自动回收。
   *
   * @param uri - localStorage 中的文件路径（即 attachment 记录的 local_uri）
   * @param mediaType - 文件 MIME 类型，调用方知道时应传入以避免内部探测
   */
  getUrl(uri: string, mediaType?: string): Promise<string>;

  /** 删除文件 */
  delete(id: string): Promise<void>;
}
