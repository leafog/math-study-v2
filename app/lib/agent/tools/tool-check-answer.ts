import { tool } from "ai";
import { z } from "zod";
import { AnswerRecordSchema } from "~/db/db-zod-schema";
import { answerRecordColl, answerAnalysisColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

/** Normalize math delimiters to $$...$$ (the only supported format) */
const normalizeMath = (text: string) =>
  text
    .replaceAll("\\[", "$$")
    .replaceAll("\\]", "$$")
    .replaceAll("\\(", "$$")
    .replaceAll("\\)", "$$")
    .replaceAll("$", "$$")
    .replaceAll("$$$$", "$$");

export const checkAnswer = tool({
  description: getPrompt("toolDesc.checkAnswer"),
  inputSchema: AnswerRecordSchema.omit({
    id: true,
    created_at: true,
    chat_id: true,
    time_spent_ms: true,
  }).extend({
    analysis: z
      .string()
      .optional()
      .describe(
        "AI feedback/analysis on this answer. " +
          getPrompt("format.markdown") +
          " " +
          getPrompt("format.math"),
      ),
  }),

  execute: async ({ analysis, ...input }) => {
    const chatId = chatIdStore.getState().chatId;
    const id = genId();
    const user_answer = normalizeMath(input.user_answer);
    answerRecordColl.insert({
      ...input,
      id,
      user_answer,
      chat_id: chatId,
      created_at: new Date(),
      time_spent_ms: 10086,
    });
    if (analysis) {
      answerAnalysisColl.insert({
        id: genId(),
        answer_id: id,
        problem_id: input.problem_id,
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
