/**
 * 文本相似度工具，基于 @ternlight/base 的语义嵌入引擎。
 *
 * 匹配流水线（由快到慢）：
 *  ① Exact match — 归一化后字符串全等，O(1) 同步
 *  ② CJK Jaccard 重叠 — 中文逐字比较，同步，中文场景极强
 *  ③ 语义 embedding — BERT 384 维 cosine，通过 comlink Worker 异步执行
 *
 * 嵌入向量持久化在 Worker 的 IndexedDB 中，页面重载不丢失。
 * 主线程只维护轻量 name/CJK 索引。
 *
 * 使用前需先调用 initCorpus() 将知识库内容预计算。
 */
import * as Comlink from "comlink";
import EmbedWorkerCtor from "./worker.ts?worker";
import type { EmbedWorkerApi, OmitKgTopic } from "./worker";

// ── Web Worker 管理（Comlink） ──────────────────────────

let workerApi: Comlink.Remote<EmbedWorkerApi> | null = null;

function getWorkerApi(): Comlink.Remote<EmbedWorkerApi> {
  if (!workerApi) {
    workerApi = Comlink.wrap<EmbedWorkerApi>(new EmbedWorkerCtor());
  }
  return workerApi;
}
export const initWorkerApi = () => {
  getWorkerApi();
};
export const findSimilar = (topic: OmitKgTopic) => {
  return getWorkerApi().findSimilar(topic);
};

export const addTopicVec = (topic: OmitKgTopic) => {
  return getWorkerApi().addTopicVec(topic);
};
