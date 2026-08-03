import { tool } from "ai";
import { z } from "zod";
import { AnswerRecordSchema } from "~/db/db-zod-schema";
import { answerRecordColl, answerAnalysisColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

export const checkAnswer = tool({
  description: getPrompt("toolDesc.checkAnswer"),
  inputSchema: AnswerRecordSchema.omit({
    id: true,
    created_at: true,
    chat_id: true,
  }).extend({
    analysis: z
      .string()
      .optional()
      .describe("AI feedback/analysis on this answer"),
  }),

  execute: async ({ analysis, ...input }) => {
    const chatId = chatIdStore.getState().chatId;
    const id = genId();
    answerRecordColl.insert({
      ...input,
      id,
      chat_id: chatId,
      created_at: new Date(),
    });
    if (analysis) {
      answerAnalysisColl.insert({
        id: genId(),
        answer_id: id,
        chat_id: chatId,
        content: analysis,
        created_at: new Date(),
      });
    }
    return {
      success: true,
      answer_id: id,
      correct: input.correct,
      message: input.correct ? "回答正确，已记录" : "回答有误，已记录",
    };
  },
});
