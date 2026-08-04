import { tool } from "ai";
import { z } from "zod";
import { kgTopicColl } from "~/db/tdb-collections";
import { inArray, queryOnce } from "@tanstack/react-db";
import { getPrompt } from "../instructions";
import { KgTopicSchema } from "../../../db/db-zod-schema";
import { findSimilar } from "~/lib/similar";
import { keyBy } from "lodash-es";

export const searchSimilarTopics = tool({
  description: getPrompt("toolDesc.searchSimilarTopics"),
  inputSchema: KgTopicSchema.omit({
    created_at: true,
    updated_at: true,
  }),
  execute: async (input) => {
    // 调用 Worker 语义搜索 top-5
    console.log("look");
    const results = await findSimilar(input);
    console.log(results);

    if (results.length === 0) {
      return { matches: [], message: "未找到相似知识点，可以放心创建" };
    }

    // 取完整 topic 数据
    const topics = await queryOnce((q) =>
      q.from({ kgTopicColl }).where(({ kgTopicColl }) =>
        inArray(
          kgTopicColl.id,
          results.map((it) => it.topic_id),
        ),
      ),
    );
    const topicsMap = keyBy(topics, (it) => it.id);

    const matches = results
      .map((r) => {
        const topic = topicsMap[r.topic_id];
        if (!topic) return null;
        return {
          id: topic.id,
          name: topic.name,
          subject: topic.subject,
          description: topic.description,
          i18n: topic.i18n,
          similarity: Math.round(r.score * 100) / 100,
        };
      })
      .filter(Boolean);

    return {
      matches,
      message:
        matches.length > 0
          ? `找到 ${matches.length} 个相似知识点，请判断是否需要创建新知识点`
          : "未找到相似知识点，可以放心创建",
    };
  },
});
