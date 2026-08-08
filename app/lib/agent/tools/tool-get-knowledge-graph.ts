import { tool } from "ai";
import { z } from "zod";
import { getPrompt } from "../instructions";
import { kgTopicsStore } from "~/store/kg-topics-store";

const GetKnowledgeGraphOutputSchema = z.object({
  topics: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string(),
    }),
  ),
  edges: z.array(
    z.object({
      prerequisite_id: z.string(),
      topic_id: z.string(),
      strength: z.enum(["hard", "soft"]),
    }),
  ),
});

export const getKnowledgeGraph = tool({
  description: getPrompt("toolDesc.getKnowledgeGraph"),
  inputSchema: z.object({}),
  execute: async () => {
    const { topics, edges } = kgTopicsStore.getState();

    return GetKnowledgeGraphOutputSchema.parse({ topics, edges });
  },
});
