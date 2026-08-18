import type { OcrResult, OcrResultItem } from "@paddleocr/paddleocr-js";

interface LayoutItem {
  text: string;
  x: number;
  top: number;
  bottom: number;
}

/**
 * 把 PaddleOCR 的识别结果转换成 Markdown 文本。
 *
 * - 支持传入单个 OcrResult 或 OcrResult[]（多张图片时用空行分隔）
 * - 按视觉阅读顺序排序：先从上到下，再从左到右
 * - 同一视觉行内的文本用空格连接，不同行用换行分隔
 */
export const ocrResultToMarkdown = (input: OcrResult | OcrResult[]): string => {
  const results = Array.isArray(input) ? input : [input];
  return results.map(resultToMarkdown).filter(Boolean).join("\n\n");
};

const resultToMarkdown = (result: OcrResult): string => {
  const items = (result.items ?? [])
    .map(toLayoutItem)
    .filter((item): item is LayoutItem => item !== null);

  if (items.length === 0) return "";

  items.sort((a, b) => a.top - b.top || a.x - b.x);

  const lines = groupIntoLines(items);

  return lines
    .map((line) =>
      line
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" "),
    )
    .join("\n");
};

const toLayoutItem = (item: OcrResultItem): LayoutItem | null => {
  const text = (item.text ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;

  const xs = item.poly.map(([x]) => x);
  const ys = item.poly.map(([, y]) => y);
  const top = ys.length > 0 ? Math.min(...ys) : 0;
  const bottom = ys.length > 0 ? Math.max(...ys) : 0;

  return {
    text,
    x:
      xs.length > 0 ? xs.reduce((sum, value) => sum + value, 0) / xs.length : 0,
    top,
    bottom,
  };
};

const groupIntoLines = (items: LayoutItem[]): LayoutItem[][] => {
  const lines: LayoutItem[][] = [];

  for (const item of items) {
    const lastLine = lines[lines.length - 1];
    if (!lastLine) {
      lines.push([item]);
      continue;
    }

    const lineTop = Math.min(...lastLine.map((it) => it.top));
    const lineBottom = Math.max(...lastLine.map((it) => it.bottom));
    const lineHeight = Math.max(1, lineBottom - lineTop);
    const itemHeight = Math.max(1, item.bottom - item.top);
    const tolerance = Math.min(lineHeight, itemHeight) * 0.5;
    const overlap =
      Math.min(lineBottom, item.bottom) - Math.max(lineTop, item.top);

    if (overlap >= -tolerance) {
      lastLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines;
};
