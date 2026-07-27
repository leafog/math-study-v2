import { tool } from "ai";
import { problemColl } from "~/db/tdb-collections";
import { ProblemSchema } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";
import z from "zod";

export const createProblem = tool({
  description:
    "创建一个数学题目并展示给学生。当需要出题、布置练习、或者对话中需要让学生尝试解题时，使用此工具。题目内容支持 Markdown 和 LaTeX 格式",
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
