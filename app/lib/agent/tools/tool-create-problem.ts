import { tool } from "ai";
import { problemColl, problemChatRelColl } from "~/db/tdb-collections";
import {
  CreateProblemOutputSchema,
  ProblemSchema,
  type Problem,
} from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";
import type { ProblemChatRel } from "../../../db/db-zod-schema";

export const createProblem = tool({
  description: getPrompt("toolDesc.createProblem"),
  inputSchema: ProblemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    status: true,
  }),
  execute: async (input, context) => {
    const chat_id = chatIdStore.getState().chatId;
    const now = new Date();
    const pid = genId();
    const tool_call_id = context.toolCallId;

    // 保存题目到 problem 表
    const problem: Problem = {
      ...input,
      id: pid,
      chat_id,
      status: "unanswered" as const,
      created_at: now,
      updated_at: now,
    };

    const problemChatRel: ProblemChatRel = {
      id: genId(),
      pid,
      chat_id,
      tool_call_id,
      created_at: now,
      updated_at: now,
    };
    problemChatRelColl.insert(problemChatRel);
    problemColl.insert(problem);

    return CreateProblemOutputSchema.parse({
      ...input,
      id: pid,
      chat_id,
    });
  },
});
