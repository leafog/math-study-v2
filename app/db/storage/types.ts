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

  getUrl(uri: string): Promise<string>;

  delete(id: string): Promise<void>;
  getFile(filename: string): Promise<ArrayBuffer>;
}
