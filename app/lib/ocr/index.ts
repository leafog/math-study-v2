import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "~/lib/i18n";
import { getOcr, type OCR } from "./ocr-core";

export { getOcr } from "./ocr-core";
export { ocrResultToMarkdown } from "./to-markdown";
export type { OCR } from "./ocr-core";

/**
 * 项目启动后后台预热 OCR：不阻塞 UI，也不 await 结果。
 * 首次真正使用图片识别时，模型通常已经加载完成或正在加载。
 */
export const preloadOcr = (lang?: string) => {
  const language = lang ?? i18n.language ?? i18n.resolvedLanguage ?? "zh";
  void getOcr(language);
};

/**
 * 按当前 i18n 语言取 OCR 实例。加载完成前返回 null,实例就绪后返回 OCR 对象。
 * 语言切换会自动重取对应语言的实例;已加载过的语言复用缓存(方案 B)。
 */
export const useOcr = () => {
  const { i18n } = useTranslation();
  const [ocr, setOcr] = useState<OCR | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOcr(i18n.language).then((inst) => {
      if (!cancelled) setOcr(inst);
    });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  return ocr;
};
