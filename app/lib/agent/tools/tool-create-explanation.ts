import { tool } from "ai";
import { z } from "zod";
import { problemExplanationColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

export const createExplanation = tool({
  description: getPrompt("toolDesc.createExplanation"),
  inputSchema: z.object({
    problem_id: z.string().describe("Problem ID to attach the explanation to"),
    content: z
      .string()
      .describe("Standard solution/explanation in Markdown + LaTeX"),
  }),

  execute: async (input) => {
    const chatId = chatIdStore.getState().chatId;
    const id = genId();
    problemExplanationColl.insert({
      id,
      ...input,
      chat_id: chatId,
      created_at: new Date(),
    });
    return {
      success: true,
      explanation_id: id,
      message: "题目解析已保存",
    };
  },
});
