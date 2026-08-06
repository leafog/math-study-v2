import { tool } from "ai";
import { kgTopicColl, chatKgTopicColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";

import { CreateTopicOutputSchema, KgTopicSchema } from "~/db/db-zod-schema";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";
import { addTopicVec } from "~/lib/similar";

export const createTopic = tool({
  description: getPrompt("toolDesc.createTopic"),
  inputSchema: KgTopicSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }),
  execute: async (input) => {
    const chatId = chatIdStore.getState().chatId;

    const now = new Date();
    const topic = {
      ...input,
      id: genId(),
      created_at: now,
      updated_at: now,
    };

    kgTopicColl.insert(topic);
    await addTopicVec(topic);

    // 关联到当前会话
    if (chatId) {
      chatKgTopicColl.insert({
        id: genId(),
        chat_id: chatId,
        topic_id: topic.id,
        created_at: new Date(),
      });
    }

    return CreateTopicOutputSchema.parse({
      success: true,
      topic_id: topic.id,
      message: `已创建知识点: ${topic.name}`,
    });
  },
});
