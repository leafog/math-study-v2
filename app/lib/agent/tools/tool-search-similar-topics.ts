import { tool } from "ai";
import { inArray, queryOnce } from "@tanstack/react-db";
import { keyBy } from "lodash-es";
import { z } from "zod";
import { SearchSimilarTopicsOutputSchema } from "../../../db/db-zod-schema";
import { getPrompt } from "../instructions";
import { searchTopics } from "~/lib/similar/orama-index";
import { kgTopicColl } from "~/db/tdb-collections";

export const searchSimilarTopics = tool({
  description: getPrompt("toolDesc.searchSimilarTopics"),
  inputSchema: z.object({
    name: z.string().describe("要搜索的知识点名称"),
  }),
  execute: async (input) => {
    const { hits } = await searchTopics(input.name);

    if (hits.length === 0) {
      return SearchSimilarTopicsOutputSchema.parse({
        matches: [],
        message: "未找到相似知识点，可以放心创建",
      });
    }

    const topics = await queryOnce((q) =>
      q.from({ kgTopicColl }).where(({ kgTopicColl }) =>
        inArray(
          kgTopicColl.id,
          hits.map((it) => it.id),
        ),
      ),
    );
    const topicsMap = keyBy(topics, (it) => it.id);

    const matches = hits
      .map((hit) => {
        const topic = topicsMap[hit.id];
        if (!topic) return null;
        return {
          id: topic.id,
          name: topic.name,
          subject: topic.subject,
          description: topic.description,
          i18n: topic.i18n,
          similarity: Math.round(hit.score * 100) / 100,
        };
      })
      .filter(Boolean);

    return SearchSimilarTopicsOutputSchema.parse({
      matches,
      message:
        matches.length > 0
          ? `找到 ${matches.length} 个相似知识点，请判断是否需要创建新知识点`
          : "未找到相似知识点，可以放心创建",
    });
  },
});
