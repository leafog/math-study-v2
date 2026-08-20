import { getOrPut } from "../map-utils";
import type { PaddleOCR } from "@paddleocr/paddleocr-js";

export type OCR = Awaited<ReturnType<typeof PaddleOCR.create>>;

const LANG_MAP: Record<string, string> = {
  zh: "ch",
  en: "en",
};

const CREATE_OPTS = {
  ocrVersion: "PP-OCRv6",
  worker: true,
  ortOptions: {
    backend: "wasm",
    wasmPaths: "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/",
    numThreads: 2,
    simd: true,
  },
} as const;

// 模块级单例:每个语言一份实例。getOrPut 会把 in-flight 的 promise 也缓存,
// 并发/重复调用共享同一次初始化。方案 B:常驻所有语言,不 dispose(切回秒级)。
const instances = new Map<string, OCR | Promise<OCR>>();

/**
 * 按语言取 OCR 实例(懒加载 + 动态 import,首次用到才拉包)。
 * 失败时从缓存移除,以便下次调用重试。
 */
const normalizeLang = (lang: string) => lang.toLowerCase().split("-")[0];

export const getOcr = (lang: string): Promise<OCR> => {
  const paddleLang = LANG_MAP[normalizeLang(lang)] ?? "ch";
  const p = getOrPut(instances, paddleLang, async () => {
    const { PaddleOCR } = await import("@paddleocr/paddleocr-js");
    return PaddleOCR.create({ ...CREATE_OPTS, lang: paddleLang });
  });
  p.catch(() => instances.delete(paddleLang));
  return p;
};
