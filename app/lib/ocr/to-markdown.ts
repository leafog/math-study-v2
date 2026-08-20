import type { OcrResult, OcrResultItem } from "@paddleocr/paddleocr-js";
import { GapTree, type BBox } from "./gap-tree";

/**
 * 根据 poly 计算文本块的外接框 [x0, y0, x1, y1]。
 */
const getBbox = (item: OcrResultItem): BBox => {
  const xs = item.poly.map(([x]) => x);
  const ys = item.poly.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/**
 * 把 PaddleOCR 的识别结果转换成 Markdown 文本。
 *
 * - 支持传入单个 OcrResult 或 OcrResult[]（多张图片时用空行分隔）
 * - 同一视觉行内的文本用空格连接，不同行用换行分隔
 *
 * pipeline：
 *
 *   PaddleOCR items
 *     → GapTree.sort()  // 只负责阅读顺序
 *     → TextBlock[]     // 转成带几何信息的块
 *     → groupLines      // 按视觉行重排
 *     → Markdown
 */
export const ocrResultToMarkdown = (input: OcrResult | OcrResult[]): string => {
  const results = Array.isArray(input) ? input : [input];
  return results.map(resultToMarkdown).filter(Boolean).join("\n\n");
};

const resultToMarkdown = (result: OcrResult): string => {
  const items = (result.items ?? []).filter((item) => item.text?.trim());
  if (items.length === 0) return "";

  // ① 只负责阅读顺序，不要在此之上重新猜行。
  const sorted = new GapTree<OcrResultItem>(getBbox).sort(items);

  // ② 转成带几何信息的块。
  const blocks = sorted.map(toTextBlock);

  // ③ 按视觉行分组。
  const lines = groupLines(blocks);

  // ④ 每一行用空格连接，行与行用换行分隔。
  return lines
    .map((line) => line.items.map((item) => item.text).join(" "))
    .join("\n");
};

/** 带几何信息的文本块。 */
interface TextBlock {
  item: OcrResultItem;
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

const toTextBlock = (item: OcrResultItem): TextBlock => {
  const [x0, y0, x1, y1] = getBbox(item);
  return {
    item,
    text: item.text.trim(),
    x0,
    y0,
    x1,
    y1,
    width: x1 - x0,
    height: y1 - y0,
  };
};

/** 一个视觉行：可能由多个块组成（上下标、同行左右块）。 */
interface OCRLine {
  items: TextBlock[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * 把（已按阅读顺序排好的）文本块分组为视觉行。
 *
 * 注意：入参 blocks 已经过 GapTree 排序，这里不要再 sort，
 * 否则会破坏多栏阅读顺序。
 */
const groupLines = (blocks: TextBlock[]): OCRLine[] => {
  const lines: OCRLine[] = [];

  for (const block of blocks) {
    const lastLine = lines.at(-1);
    // 只和当前行最后一个加入的块比，而不是和整行的合并边框比。
    // 否则行内某个特别高的块（积分号、大括号、长公式）会让 lastLine.y1
    // 异常靠下，误把视觉上的下一行判断进本行。
    const lastBlock = lastLine?.items.at(-1);

    if (!lastLine || !lastBlock) {
      lines.push({
        items: [block],
        x0: block.x0,
        y0: block.y0,
        x1: block.x1,
        y1: block.y1,
      });
      continue;
    }

    // 垂直方向是否与上一块重叠。重叠越多，越可能是同一行
    //（上下标、同行左右块）；几乎不重叠就是下一行。
    const overlap =
      Math.min(lastBlock.y1, block.y1) - Math.max(lastBlock.y0, block.y0);
    const minHeight = Math.min(lastBlock.height, block.height);

    if (overlap > minHeight * 0.3) {
      lastLine.items.push(block);
      // 合并后更新整行边界。
      lastLine.x0 = Math.min(lastLine.x0, block.x0);
      lastLine.y0 = Math.min(lastLine.y0, block.y0);
      lastLine.x1 = Math.max(lastLine.x1, block.x1);
      lastLine.y1 = Math.max(lastLine.y1, block.y1);
    } else {
      lines.push({
        items: [block],
        x0: block.x0,
        y0: block.y0,
        x1: block.x1,
        y1: block.y1,
      });
    }
  }

  return lines;
};
