import { llmPredict } from "../agent/version-agent";
import type { FileTextExtractorFC } from "./type";

/**
 * 图片类（image/*）：走本地 OCR 识别成 Markdown 文本（从图片里"提文字"，不是提图片）。
 * 如需换成视觉模型 OCR，可改用 version-agent 的 predict(blob)。
 */
const extractTextFromImage: FileTextExtractorFC = async (blob) => {
  return llmPredict(blob);
};

export default extractTextFromImage;
