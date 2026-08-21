import { keyBy } from "lodash-es";
import { parse } from "media-typer";

/** 文件类别（由 mediaType 归类） */
export enum FileType {
  Image = "image",
  Text = "text",
}
/** media 主类型（parse 出的 type，如 "image"）→ FileType 查找表 */
export const FileTypeMap = keyBy(Object.values(FileType), (it) => it);

/** 根据 mediaType 推断文件类别；无法归类的返回 null */
export const getFileType = (mediaType: string): FileType | undefined => {
  const { type } = parse(mediaType);
  return FileTypeMap[type];
};

/** 单个提取器：把文件内容转成文字信息 */
export type FileTextExtractorFC = (
  blob: Blob,
  options?: { mediaType?: string; filename?: string },
) => Promise<string>;

/** 按文件类别聚合的提取器表 */
export type FileTextExtractors = Partial<Record<FileType, FileTextExtractorFC>>;
