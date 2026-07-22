/**
 * 文本相似度工具，基于 @ternlight/base 的语义嵌入引擎。
 *
 *  ① 文本归一化 + exact match（快，0 依赖）
 *  ② ternlight embed + cosineSim（语义级别，跨语言）
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
  text: string; // 用于 embedding 的完整文本（name + description）
  vec: Float32Array;
}

const corpus = new Map<string, CorpusEntry>();

/**
 * 将知识库中的已有 topics 预计算为 embedding，存入缓存。
 *
 * 应该在应用启动时或首次需要查重前调用一次。
 * 后续可通过 addToCorpus() 增量添加新创建的 topic。
 *
 * @param topics — 所有已有知识点
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

/**
 * 缓存中已有的 topic 数量。
 */
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
    .replace(/[^\w\s一-鿿]/g, "")
    .trim();
}

function buildEmbedText(topic: TopicBrief): string {
  if (topic.description) {
    return `${topic.name}: ${topic.description}`;
  }
  return topic.name;
}

// ── 匹配结果 ──────────────────────────────────────────

export interface TopicMatch {
  id: string;
  matchType: "exact" | "semantic";
  sim?: number;
}

export interface TopicBrief {
  id: string;
  name: string;
  subject: string;
  description?: string | null;
}

// ── 查找相似知识点 ────────────────────────────────────

/**
 * 在同 subject 内查找与 name 语义相似的知识点。
 *
 * 需要先调用 initCorpus() 初始化知识库缓存，否则返回 null。
 *
 * @param name — 要检查的新知识点名称
 * @param subject — 学科，用于缩小搜索范围
 * @returns 匹配结果，无匹配返回 null
 */
export function findSimilarTopic(
  name: string,
  subject: string,
): TopicMatch | null {
  if (corpus.size === 0) return null;

  const nameNorm = normalizeName(name);

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

  // ③ 语义匹配（ternlight）
  ensureWarmed();
  const queryVec = embed(nameNorm);

  let bestSim = -1;
  let bestEntry: CorpusEntry | null = null;

  for (const c of candidates) {
    const sim = cosineSim(queryVec, c.vec);
    if (sim > bestSim) {
      bestSim = sim;
      bestEntry = c;
    }
  }

  if (bestEntry && bestSim >= 0.85) {
    return { id: bestEntry.id, matchType: "semantic", sim: bestSim };
  }

  return null;
}
