/**
 * 文本相似度工具，基于 @ternlight/base 的语义嵌入引擎。
 *
 *  ① 文本归一化 + exact match（快，0 依赖）
 *  ② CJK 字符 Jaccard 重叠（快速预筛，中文场景极强信号）
 *  ③ ternlight embed + cosineSim（语义级别，跨语言）
 *
 * 使用前需先调用 initCorpus() 将知识库内容预计算为 embedding 缓存。
 */
import { embed, cosineSim } from "@ternlight/base";

// ── WASM 预热 ──────────────────────────────────────────
let warmed = false;
function ensureWarmed() {
  if (!warmed) {
    embed("");
    warmed = true;
  }
}

// ── 知识库 embedding 缓存 ─────────────────────────────

interface CorpusEntry {
  id: string;
  name: string;
  nameNorm: string;
  subject: string;
  text: string; // 用于 embedding 的完整文本（name + i18n + description）
  vec: Float32Array;
}

const corpus = new Map<string, CorpusEntry>();

/**
 * 将知识库中的已有 topics 预计算为 embedding，存入缓存。
 *
 * 应该在应用启动时或首次需要查重前调用一次。
 * 后续可通过 addToCorpus() 增量添加新创建的 topic。
 */
export function initCorpus(topics: TopicBrief[]): void {
  ensureWarmed();

  for (const t of topics) {
    const text = normalizeName(buildEmbedText(t));
    corpus.set(t.id, {
      id: t.id,
      name: t.name,
      nameNorm: normalizeName(t.name),
      subject: t.subject,
      text,
      vec: embed(text),
    });
  }
}

/**
 * 将一个新创建的 topic 加入缓存（无需重新全量初始化）。
 */
export function addToCorpus(topic: TopicBrief, vec?: Float32Array): void {
  const text = normalizeName(buildEmbedText(topic));
  corpus.set(topic.id, {
    id: topic.id,
    name: topic.name,
    nameNorm: normalizeName(topic.name),
    subject: topic.subject,
    text,
    vec: vec ?? embed(text),
  });
}

/** 缓存中已有的 topic 数量。 */
export function corpusSize(): number {
  return corpus.size;
}

// ── 文本归一化 ────────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFKC")
    .replace(/[\s_-]+/g, " ")
    .replace(/[^\w\s一-鿿㐀-䶿]/g, "")
    .trim();
}

/**
 * 构建用于 embedding 的完整文本。
 * 包含 name + i18n 翻译名 + description + description_i18n，
 * 让 embedding 模型捕获跨语言的语义关联。
 */
function buildEmbedText(topic: TopicBrief): string {
  const parts: string[] = [topic.name];

  // i18n 翻译名（zh/en 名称）
  if (topic.i18n) {
    const zhName = topic.i18n.zh || topic.i18n["zh-CN"];
    const enName = topic.i18n.en || topic.i18n["en-US"];
    if (zhName) parts.push(zhName);
    if (enName && enName !== topic.name) parts.push(enName);
  }

  // 英文描述
  if (topic.description) {
    parts.push(topic.description);
  }

  // i18n 描述
  if (topic.description_i18n) {
    const zhDesc = topic.description_i18n.zh || topic.description_i18n["zh-CN"];
    const enDesc = topic.description_i18n.en || topic.description_i18n["en-US"];
    if (zhDesc) parts.push(zhDesc);
    if (enDesc && enDesc !== topic.description) parts.push(enDesc);
  }

  return parts.join(" ");
}

// ── CJK 字符工具 ──────────────────────────────────────

/** 提取文本中的中日韩统一表意文字（不包含标点/假名/韩文） */
function extractCjkChars(text: string): Set<string> {
  const chars = new Set<string>();
  for (const ch of text) {
    if (/^[一-鿿㐀-䶿]$/.test(ch)) {
      chars.add(ch);
    }
  }
  return chars;
}

/** Jaccard 相似度 */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const ch of a) {
    if (b.has(ch)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

// ── 匹配结果 ──────────────────────────────────────────

export interface TopicMatch {
  id: string;
  matchType: "exact" | "semantic" | "cjk";
  sim?: number;
}

export interface TopicBrief {
  id: string;
  name: string;
  subject: string;
  description?: string | null;
  i18n?: Record<string, string> | null;
  description_i18n?: Record<string, string> | null;
}

// ── 查找相似知识点 ────────────────────────────────────

export interface FindSimilarOptions {
  /** 额外的查询文本，用于丰富 embedding（如 i18n 翻译、描述等） */
  queryText?: string;
}

/**
 * 在同 subject 内查找与 name 语义相似的知识点。
 *
 * 需要先调用 initCorpus() 初始化知识库缓存，否则返回 null。
 *
 * 匹配策略（按优先级）：
 * 1. Exact match — 归一化后名称完全相同
 * 2. CJK 字符 Jaccard ≥ 0.5 — 中文名高度重叠，直接判定为重复
 * 3. 语义匹配 — cosineSim，阈值根据 CJK 重叠动态调整
 *
 * @param name — 要检查的新知识点名称（kebab-case）
 * @param subject — 学科，用于缩小搜索范围
 * @param options.queryText — 额外查询文本（i18n 翻译 + 描述），提升 embedding 质量
 */
export function findSimilarTopic(
  name: string,
  subject: string,
  options?: FindSimilarOptions,
): TopicMatch | null {
  if (corpus.size === 0) return null;

  const nameNorm = normalizeName(name);
  const queryText = options?.queryText
    ? normalizeName(options.queryText)
    : nameNorm;

  // ① 同 subject 过滤
  const candidates: CorpusEntry[] = [];
  for (const entry of corpus.values()) {
    if (entry.subject === subject) candidates.push(entry);
  }
  if (candidates.length === 0) return null;

  // ② Exact match（归一化后）
  for (const c of candidates) {
    if (c.nameNorm === nameNorm) {
      return { id: c.id, matchType: "exact" };
    }
  }

  // ③ CJK 字符重叠快速预筛
  //    中文场景下，字符级 Jaccard ≥ 0.5 是极强的重复信号
  const queryCjk = extractCjkChars(queryText);
  let bestCjkEntry: CorpusEntry | null = null;
  let bestCjkScore = 0;

  if (queryCjk.size > 0) {
    for (const c of candidates) {
      const candCjk = extractCjkChars(c.text);
      if (candCjk.size === 0) continue;
      const score = jaccard(queryCjk, candCjk);
      if (score > bestCjkScore) {
        bestCjkScore = score;
        bestCjkEntry = c;
      }
    }
  }

  // CJK 高重叠 → 直接判定为重复（即使 embedding 相似度不够）
  if (bestCjkEntry && bestCjkScore >= 0.5) {
    return {
      id: bestCjkEntry.id,
      matchType: "cjk",
      sim: bestCjkScore,
    };
  }

  // ④ 语义匹配（ternlight）
  ensureWarmed();
  const queryVec = embed(queryText);

  let bestSim = -1;
  let bestEntry: CorpusEntry | null = null;

  for (const c of candidates) {
    const sim = cosineSim(queryVec, c.vec);
    if (sim > bestSim) {
      bestSim = sim;
      bestEntry = c;
    }
  }

  // 动态阈值：有 CJK 部分重叠 → 降低阈值；无 CJK → 标准阈值
  const threshold = bestCjkScore > 0.3 ? 0.72 : 0.78;

  if (bestEntry && bestSim >= threshold) {
    return { id: bestEntry.id, matchType: "semantic", sim: bestSim };
  }

  return null;
}
