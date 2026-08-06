import { tool } from "ai";
import { z } from "zod";
import { genId } from "~/lib/id-utils";
import { kgEdgeColl } from "~/db/tdb-collections";
import { getPrompt } from "../instructions";
import { CreateRelationshipOutputSchema } from "~/db/db-zod-schema";

const createRelationshipInputSchema = z.object({
  relationships: z
    .array(
      z.object({
        prerequisite_id: z.string().describe("前置知识点的 ID，必须先掌握这个"),
        topic_id: z
          .string()
          .describe("依赖该前置知识点的主题 ID，学完前置才能学这个"),
        strength: z
          .enum(["hard", "soft"])
          .describe("hard=严格前置（必须），soft=推荐前置（灵活）"),
        reason: z
          .string()
          .optional()
          .describe("为什么这个前置关系存在的自然语言解释"),
      }),
    )
    .describe("要创建的前置依赖关系列表"),
});

export const createRelationship = tool({
  description: getPrompt("toolDesc.createRelationship"),
  inputSchema: createRelationshipInputSchema,
  execute: async (input) => {
    const now = new Date();
    const created = [];
    for (const rel of input.relationships) {
      const edge = {
        id: genId(),
        prerequisite_id: rel.prerequisite_id,
        topic_id: rel.topic_id,
        strength: rel.strength,
        reason: rel.reason ?? null,
        created_at: now,
      };

      kgEdgeColl.insert(edge);
      created.push({
        id: edge.id,
        prerequisite_id: edge.prerequisite_id,
        topic_id: edge.topic_id,
        strength: edge.strength,
      });
    }

    return CreateRelationshipOutputSchema.parse({
      success: true,
      created,
      message: `已创建 ${created.length} 条知识点关系`,
    });
  },
});
