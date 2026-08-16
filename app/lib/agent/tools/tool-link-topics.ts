import { tool } from "ai";
import { eq, queryOnce } from "@tanstack/react-db";
import { z } from "zod";
import { chatKgTopicColl } from "~/db/tdb-collections";
import { LinkTopicsOutputSchema } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

export const linkTopics = tool({
  description: getPrompt("toolDesc.linkTopics"),
  inputSchema: z.object({
    topic_ids: z.array(z.string()).describe("要关联到当前会话的知识点 ID 列表"),
  }),
  execute: async (input) => {
    const chatId = chatIdStore.getState().chatId;
    const now = new Date();

    if (!chatId) {
      return LinkTopicsOutputSchema.parse({
        success: false,
        linked: [],
        skipped: input.topic_ids,
        message: "当前没有可关联的会话",
      });
    }

    // 查询当前会话已关联的知识点，避免重复关联
    const existing = await queryOnce((q) =>
      q
        .from({ chatKgTopicColl })
        .where(({ chatKgTopicColl }) => eq(chatKgTopicColl.chat_id, chatId)),
    );
    const existingTopicIds = new Set(existing.map((it) => it.topic_id));

    const linked: string[] = [];
    const skipped: string[] = [];
    for (const topicId of input.topic_ids) {
      if (existingTopicIds.has(topicId)) {
        skipped.push(topicId);
        continue;
      }
      chatKgTopicColl.insert({
        id: genId(),
        chat_id: chatId,
        topic_id: topicId,
        created_at: now,
      });
      linked.push(topicId);
    }

    return LinkTopicsOutputSchema.parse({
      success: true,
      linked,
      skipped,
      message:
        linked.length > 0
          ? `已关联 ${linked.length} 个知识点到当前会话`
          : "这些知识点已关联，无需重复操作",
    });
  },
});
