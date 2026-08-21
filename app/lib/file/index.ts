import { FileType, getFileType, type FileTextExtractors } from "./type";
import extractImage from "./extract-image";
import extractText from "./extract-text";

export {
  FileType,
  getFileType,
  type FileTextExtractorFC,
  type FileTextExtractors,
} from "./type";

/** 按文件类别注册的提取器 */
const fileTextExtractors: FileTextExtractors = {
  [FileType.Image]: extractImage,
  [FileType.Text]: extractText,
};

export async function extractFileText(
  blob: Blob,
  mediaType?: string,
): Promise<string> {
  const mime = mediaType ?? blob.type ?? "";
  const type = getFileType(mime);
  const extractor = type ? fileTextExtractors[type] : undefined;
  if (!extractor) {
    throw new Error(`Unsupported media type: ${mime || "(empty)"}`);
  }
  return extractor(blob, { mediaType: mime });
}
