/**
 * 图片合成工具：把 svg 字符串 / 图片 URL 拼成一张带编号标签的网格图，导出为 PNG blob。
 * 用于发送前把多个标注区域合成一张图，交给视觉模型一次识别。
 */

export type ComposeSource =
  | { kind: "svg"; data: string } // SVG XML 字符串
  | { kind: "image"; data: string }; // 图片 URL / dataURL / blob URL

export type ComposeCell = {
  source: ComposeSource;
  /** svg：场景坐标 bounds（内部用 viewBox 换算成像素裁剪）；image：忽略 */
  bounds?: [number, number, number, number];
  /** image：源图像素坐标系裁剪矩形；svg：忽略（用 bounds） */
  crop?: { x: number; y: number; w: number; h: number };
  /** 格子左上角标签（如编号） */
  label?: string;
};

export type ComposeOptions = {
  /** 目标合成宽度（px）；每行图片尽量凑满它 */
  rowWidth?: number;
  /** 每行图片区高度上限（px），避免单行被拉得过高 */
  maxRowHeight?: number;
  /** 顶部标签带高度（px） */
  labelHeight?: number;
  /** 格子间距（px） */
  gap?: number;
  /** 画布内边距（px） */
  padding?: number;
  backgroundColor?: string;
  /** 标签带背景色 */
  headerColor?: string;
  /** 标签文字颜色 */
  labelColor?: string;
};

const DEFAULT_GAP = 12;
const DEFAULT_PADDING = 12;

/** 把 SVG XML 编码成可直接喂给 <img> 的 data URL */
const svgToDataUrl = (xml: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

/**
 * 确保 svg 有固有尺寸（width/height）。
 * 若根元素只有 viewBox 没有 width/height，<img> 拿不到固有尺寸（naturalWidth=0），
 * 导致 drawImage 静默跳过。这里用 viewBox 补齐 width/height，保证 naturalWidth>0。
 */
function ensureSvgIntrinsicSize(xml: string): string {
  const vb = svgViewBox(xml);
  if (!vb) return xml;
  // 根 <svg ...> 已有 width/height 就无需注入
  if (/\s(width|height)=["']/.test(xml)) return xml;
  const openTagMatch = xml.match(/<svg([^>]*)>/);
  if (!openTagMatch) return xml;
  const tag = openTagMatch[0];
  const inject = ` width="${Math.round(vb.w)}" height="${Math.round(vb.h)}"`;
  return xml.replace(tag, tag.replace(/>\s*$/, inject + ">"));
}

/** 加载一张图（svg 走 data URL，image 直接作为 src） */
function loadImage(source: ComposeSource): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          source.kind === "svg"
            ? "img-utils: failed to load SVG image"
            : `img-utils: failed to load image: ${source.data.slice(0, 60)}`,
        ),
      );
    img.src =
      source.kind === "svg"
        ? svgToDataUrl(ensureSvgIntrinsicSize(source.data))
        : source.data;
  });
}

/** 从 SVG XML 解析 viewBox；解析不到返回 null */
export function svgViewBox(
  xml: string,
): { x: number; y: number; w: number; h: number } | null {
  const m = xml.match(
    /viewBox=["']\s*([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s*["']/,
  );
  if (!m) return null;
  return { x: +m[1], y: +m[2], w: +m[3], h: +m[4] };
}

/**
 * 把 svg 场景坐标 bounds 换算成 svg 像素坐标系内的裁剪矩形。
 * 依赖 viewBox 与元素同处场景坐标系（exportToSvg 导出即如此）。
 * 解析不到 viewBox 时返回 null（此时应整图使用）。
 */
export function svgSceneBoundsToCrop(
  xml: string,
  naturalWidth: number,
  naturalHeight: number,
  bounds: [number, number, number, number],
): { x: number; y: number; w: number; h: number } | null {
  const vb = svgViewBox(xml);
  if (!vb || vb.w === 0 || vb.h === 0) return null;
  const sx = naturalWidth / vb.w;
  const sy = naturalHeight / vb.h;
  const [minX, minY, maxX, maxY] = bounds;
  return {
    x: (minX - vb.x) * sx,
    y: (minY - vb.y) * sy,
    w: (maxX - minX) * sx,
    h: (maxY - minY) * sy,
  };
}

type PlacedCell = {
  /** 图片区左上角（画布坐标） */
  dx: number;
  dy: number;
  /** 图片区宽高：按图片宽高比定尺寸，无留白（最密堆积） */
  imageW: number;
  imageH: number;
};

/**
 * 按宽高比做整行排版（justified mosaic）：每行图片凑满 rowWidth，格高按宽高比分摊，
 * 从而让合成图尽量紧密、缩小整体尺寸。返回每格图片区的位置与画布尺寸。
 */
function layoutMosaic(
  aspects: number[],
  opts: ComposeOptions,
): {
  placed: PlacedCell[];
  width: number;
  height: number;
  labelH: number;
  gap: number;
  pad: number;
} {
  const gap = opts.gap ?? DEFAULT_GAP;
  const pad = opts.padding ?? DEFAULT_PADDING;
  const labelH = opts.labelHeight ?? 40;
  const targetW = opts.rowWidth ?? 1600;
  const targetH = opts.maxRowHeight ?? 512;

  // 分「行」：当前行宽高比和 + 下一张 > 目标宽/目标高 则换行
  const rows: number[][] = [];
  let cur: number[] = [];
  let curAspect = 0;
  for (const a of aspects) {
    if (cur.length > 0 && curAspect + a > targetW / targetH) {
      rows.push(cur);
      cur = [];
      curAspect = 0;
    }
    cur.push(a);
    curAspect += a;
  }
  if (cur.length > 0) rows.push(cur);

  const placed: PlacedCell[] = [];
  let canvasW = pad * 2 + targetW;
  let canvasH = pad;
  let rowTop = pad;
  for (const row of rows) {
    const sumA = row.reduce((s, a) => s + a, 0);
    const rowH = Math.min(targetW / sumA, targetH);
    let x = pad;
    for (const a of row) {
      const w = (a / sumA) * targetW;
      placed.push({ dx: x, dy: rowTop + labelH, imageW: w, imageH: rowH });
      x += w + gap;
    }
    canvasH = rowTop + labelH + rowH;
    rowTop = canvasH + pad + gap;
  }
  canvasH += pad;
  return {
    placed,
    width: Math.ceil(canvasW),
    height: Math.ceil(canvasH),
    labelH,
    gap,
    pad,
  };
}

/**
 * 把一组标注（svg / image）合成一张网格图，导出为 PNG blob。
 * 每格顶部是标签带（编号不污染图片），下方是图片区。
 * - svg：整图使用；
 * - image：按 crop（像素坐标）裁剪，缺省整图。
 */
export async function composeImagesToBlob(
  cells: ComposeCell[],
  opts: ComposeOptions = {},
): Promise<Blob> {
  if (cells.length === 0) {
    throw new Error(
      "img-utils: composeImagesToBlob requires at least one cell",
    );
  }

  const imgs = await Promise.all(cells.map((c) => loadImage(c.source)));
  // 每格宽高比：image 用裁剪后尺寸，svg 用整图固有尺寸
  const aspects = cells.map((c, i) => {
    const img = imgs[i];
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (c.source.kind === "image" && c.crop) {
      w = c.crop.w;
      h = c.crop.h;
    }
    return h > 0 ? w / h : 1;
  });
  const { placed, labelH, width, height } = layoutMosaic(aspects, opts);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("img-utils: canvas 2d context not supported");
  }

  ctx.fillStyle = opts.backgroundColor ?? "#ffffff";
  ctx.fillRect(0, 0, width, height);

  imgs.forEach((img, i) => {
    const cell = cells[i];
    const { dx, dy, imageW, imageH } = placed[i];

    // 顶部标签带：编号放这里，不盖住图片
    if (cell.label) {
      ctx.fillStyle = opts.headerColor ?? "#e2e8f0";
      ctx.fillRect(dx, dy - labelH, imageW, labelH);
      ctx.fillStyle = opts.labelColor ?? "#0f172a";
      ctx.font = `bold ${Math.round(labelH * 0.5)}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillText(cell.label, dx + imageW / 2, dy - labelH / 2);
      ctx.textBaseline = "alphabetic";
    }

    // 确定源矩形：image 按 crop 裁剪，svg 整图使用（不裁剪）
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (cell.source.kind === "image" && cell.crop) {
      ({ x: sx, y: sy, w: sw, h: sh } = cell.crop);
    }

    // 图片区按格尺寸整体填充（宽高比一致，无留白）
    const drawn = sw > 0 && sh > 0;
    if (drawn) {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, imageW, imageH);
    }

    // 图片区边框，把不同标注视觉上隔开
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 1, dy + 1, imageW - 2, imageH - 2);
    // 调试：确认每格加载与裁剪
    console.log("[img-utils:cell]", {
      i,
      kind: cell.source.kind,
      label: cell.label,
      natural: [img.naturalWidth, img.naturalHeight],
      crop: [sx, sy, sw, sh],
      drawn,
    });
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("img-utils: toBlob failed")),
      "image/png",
    );
  });
}
