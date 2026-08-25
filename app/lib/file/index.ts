import {
  FileType,
  getFileType,
  type FileCards,
  type FileIcons,
  type FileTextExtractors,
} from "./type";
import extractTextFromImage from "./extract-text-from-image";
import readTextFile from "./read-text-file";
import ImageCard from "./file-ui/image-card";
import TextCard from "./file-ui/text-card";
import { FileText, ImageIcon } from "lucide-react";

export {
  FileType,
  getFileType,
  type FileTextExtractorFC,
  type FileTextExtractors,
  type FileCards,
  type FileIcons,
} from "./type";

/** 按文件类别注册的提取器（产出都是文本） */
const fileTextExtractors: FileTextExtractors = {
  [FileType.Image]: extractTextFromImage, // 图片 → OCR 提文字
  [FileType.Text]: readTextFile, // 纯文本 → 直接读
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

export const fileCards: FileCards = {
  [FileType.Image]: ImageCard,
  [FileType.Text]: TextCard, // 纯文本 → 直接读
};

/** 按文件类别对应的图标 */
export const fileIcons: FileIcons = {
  [FileType.Image]: ImageIcon,
  [FileType.Text]: FileText,
};

/** 根据 mediaType 返回对应的卡片组件；无法归类返回 undefined */
export const getFileCard = (mediaType?: string) => {
  if (!mediaType) return undefined;
  const type = getFileType(mediaType);
  return type ? fileCards[type] : undefined;
};
