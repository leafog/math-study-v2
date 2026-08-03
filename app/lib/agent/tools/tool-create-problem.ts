import { tool } from "ai";
import { problemColl } from "~/db/tdb-collections";
import { ProblemSchema } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import { getPrompt } from "../instructions";

export const createProblem = tool({
  description: getPrompt("toolDesc.createProblem"),
  inputSchema: ProblemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }),
  execute: (input) => {
    const chatId = chatIdStore.getState().chatId;
    const now = new Date();
    const pid = genId();
    // 保存题目到 problem 表
    const problem = {
      ...input,
      id: pid,
      chat_id: chatId,
      created_at: now,
      updated_at: now,
    };
    problemColl.insert(problem);

    return { ...input, id: pid, chat_id: chatId };
  },
});
