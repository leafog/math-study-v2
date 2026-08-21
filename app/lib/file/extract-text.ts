import type { FileTextExtractorFC } from "./type";

/** 纯文本类（text/*）：直接读取 blob 为字符串 */
const extractText: FileTextExtractorFC = async (blob) => {
  const res = await blob.text();
  return res;
};

export default extractText;
