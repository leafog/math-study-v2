import { tool } from "ai";
import { z } from "zod";
import { problemChatRelColl, problemColl } from "~/db/tdb-collections";
import { getPrompt } from "../instructions";
import { chatIdStore, useChatId } from "~/store/chat-id-store";
import type { ProblemChatRel } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";

export const practiceProblem = tool({
  description: getPrompt("toolDesc.practiceProblem"),
  inputSchema: z.object({
    id: z.string().describe("ID of the problem the student is now practicing"),
  }),
  // 轻量标记工具：输入题目 id，校验存在后回传 id，UI 侧通过 problemsMap[id] 渲染题目。
  // 具体的练习记录（practiceLog / masteryScore）由后续流程按需写入。
  execute: ({ id }) => {
    const chat_id = chatIdStore.getState().chatId;

    if (!problemColl.has(id)) {
      throw new Error(`Problem with id "${id}" not found`);
    }
    const now = new Date();
    const problemChatRel: ProblemChatRel = {
      id: genId(),
      pid: id,
      chat_id,
      created_at: now,
      updated_at: now,
    };
    console.log("hehe");
    problemChatRelColl.insert(problemChatRel);
    return { id };
  },
});
