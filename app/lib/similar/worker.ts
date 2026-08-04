/**
 * Web Worker for text embedding via @ternlight/base (WASM).
 *
 * Runs embedding inference off the main thread. Embedding vectors are
 * persisted in IndexedDB so they survive page reloads.
 *
 * Exposed to the main thread via comlink — callers get typed async proxies.
 */
import * as Comlink from "comlink";
import { cosineSim, embed } from "@ternlight/base";
import Dexie, { type EntityTable } from "dexie";
import type { KgTopic } from "~/db/db-zod-schema";

interface TopicVec {
  id?: number;
  topic_id: string;
  pre_str: string;
  vec: Float32Array;
}

interface SimilarResult {
  topic_id: string;
  score: number;
}
async function init() {
  embed("warmup");
  await db.topicVec.toArray();
}

export type OmitKgTopic = Omit<KgTopic, "created_at" | "updated_at">;
export interface EmbedWorkerApi {
  findSimilar(topic: OmitKgTopic, k?: number): Promise<SimilarResult[]>;
  addTopicVec(topic: OmitKgTopic): Promise<void>;
}

// ── IndexedDB ────────────────────────────────────────────

const db = new Dexie("topic-vec") as Dexie & {
  topicVec: EntityTable<TopicVec, "id">;
};

db.version(1).stores({
  topicVec: "++id,topic_id,pre_str",
});

function buildEmbedText(topic: OmitKgTopic): string {
  const parts: string[] = [];

  const enName = topic.i18n?.en || topic.i18n?.["en-US"];
  parts.push(enName || topic.name);

  const enDesc =
    topic.description_i18n?.en || topic.description_i18n?.["en-US"];
  const desc = enDesc || topic.description;
  if (desc) parts.push(desc);

  return parts.join(" ");
}

const api: EmbedWorkerApi = {
  async findSimilar(topic: OmitKgTopic, k = 5): Promise<SimilarResult[]> {
    const queryVec = embed(buildEmbedText(topic));
    console.log(queryVec);
    const candidates = await db.topicVec.toArray();
    if (candidates.length === 0) return [];
    return candidates
      .map((it) => ({
        topic_id: it.topic_id,
        score: cosineSim(queryVec, it.vec),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  },
  async addTopicVec(topic): Promise<void> {
    const pre_str = buildEmbedText(topic);
    const queryVec = embed(buildEmbedText(topic));
    const result = await db.topicVec.where("topic_id").equals(topic.id).first();
    if (result) {
      return;
    } else {
      await db.topicVec.add({
        topic_id: topic.id,
        pre_str,
        vec: queryVec,
      });
    }
  },
};

Comlink.expose(api);
