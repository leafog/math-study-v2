import { tool } from "ai";
import { z } from "zod";
import { kgTopicColl, chatKgTopicColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { queryOnce } from "@tanstack/react-db";
import {
  findSimilarTopic,
  initCorpus,
  addToCorpus,
  corpusSize,
} from "~/lib/similar";
import { KgTopicSchema } from "~/db/db-zod-schema";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

/** 首次使用时从 DB 加载已有知识库并初始化语义缓存 */
let loading = false;
async function ensureCorpusReady(): Promise<void> {
  if (corpusSize() > 0 || loading) return;
  loading = true;
  try {
    const all = await queryOnce((q) => q.from({ kgTopicColl }));
    console.log(all);
    if (all && all.length > 0) initCorpus(all);
  } finally {
    loading = false;
  }
}

export const createTopic = tool({
  description: getPrompt("toolDesc.createTopic"),
  inputSchema: KgTopicSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }),
  execute: async (input, op) => {
    const chatId = chatIdStore.getState().chatId;
    console.log(chatId);
    // 确保知识库语义缓存就绪
    await ensureCorpusReady();

    // 构建富文本查询：name + i18n 翻译 + 描述，让查询侧 embedding 与语料库同等丰富
    const queryText = [
      input.name,
      input.i18n?.zh || input.i18n?.["zh-CN"],
      input.i18n?.en || input.i18n?.["en-US"],
      input.description,
      input.description_i18n?.zh || input.description_i18n?.["zh-CN"],
    ]
      .filter(Boolean)
      .join(" ");

    // 查重：先文本 exact match，再 CJK 重叠，最后语义相似度
    const match = findSimilarTopic(input.name, input.subject, { queryText });

    if (match) {
      // 关联已存在的知识点到当前会话
      if (chatId) {
        chatKgTopicColl.insert({
          id: genId(),
          chat_id: chatId,
          topic_id: match.id,
          created_at: new Date(),
        });
      }
      return {
        success: true,
        topic_id: match.id,
        created: false,
        matchType: match.matchType,
        message: `知识点「${input.name}」${
          match.matchType === "exact" ? "已存在（同名）" : "与已有知识点重复"
        }，已复用`,
      };
    }
    const now = new Date();
    const topic = {
      ...input,
      id: genId(),
      created_at: now,
      updated_at: now,
    };

    kgTopicColl.insert(topic);

    // 新知识点加入语义缓存
    addToCorpus(topic);

    // 关联到当前会话
    if (chatId) {
      chatKgTopicColl.insert({
        id: genId(),
        chat_id: chatId,
        topic_id: topic.id,
        created_at: new Date(),
      });
    }

    return {
      success: true,
      topic_id: topic.id,
      created: true,
      message: `已创建知识点: ${topic.name}`,
    };
  },
});
