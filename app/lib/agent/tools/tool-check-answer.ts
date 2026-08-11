import { tool } from "ai";
import { z } from "zod";
import {
  AnswerRecordSchema,
  CheckAnswerOutputSchema,
} from "~/db/db-zod-schema";
import { answerRecordColl, answerAnalysisColl } from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { normalizeMathDelimiters } from "~/lib/utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

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
    const user_answer = normalizeMathDelimiters(input.user_answer);
    const normalizedAnalysis = analysis
      ? normalizeMathDelimiters(analysis)
      : undefined;
    answerRecordColl.insert({
      ...input,
      id,
      user_answer,
      chat_id: chatId,
      created_at: new Date(),
      time_spent_ms: 10086,
    });
    if (normalizedAnalysis) {
      answerAnalysisColl.insert({
        id: genId(),
        answer_id: id,
        problem_id: input.problem_id,
        chat_id: chatId,
        content: normalizedAnalysis,
        created_at: new Date(),
      });
    }
    return CheckAnswerOutputSchema.parse({
      success: true,
      answer_id: id,
      correct: input.correct,
      message: input.correct ? "回答正确，已记录" : "回答有误，已记录",
    });
  },
});
