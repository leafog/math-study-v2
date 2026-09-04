import { llmPredict } from "../agent/version-agent";
import type { FileTextExtractorFC } from "./type";

/**
 * 图片类（image/*）：走视觉模型把图片识别成 Markdown 文本。
 * （从图片里"提文字"，不是提图片。）
 */
const extractTextFromImage: FileTextExtractorFC = async (blob) => {
  return llmPredict(blob);
};

export default extractTextFromImage;
