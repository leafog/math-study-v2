import { tool } from "ai";
import { problemColl } from "~/db/tdb-collections";
import { ProblemSchema } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";

export const createProblem = tool({
  description:
    "创建一个数学题目并展示给学生。当需要出题、布置练习、或者对话中需要让学生尝试解题时，使用此工具。题目内容支持 Markdown 和 LaTeX 格式",
  inputSchema: ProblemSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
  }),
  execute: async (input) => {
    const chatId = chatIdStore.getState().chatId;

    const now = new Date();
    const problem = {
      ...input,
      id: genId(),
      chat_id: chatId,
      created_at: now,
      updated_at: now,
    };

    await problemColl.insert(problem);

    return {
      success: true,
      problem_id: problem.id,
      content: problem.content,
      description: problem.description,
      source: problem.source,
    };
  },
});
