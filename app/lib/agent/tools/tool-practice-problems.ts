import { tool } from "ai";
import { z } from "zod";
import { problemChatRelColl, problemColl } from "~/db/tdb-collections";
import type { ProblemChatRel } from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";

export const practiceProblems = tool({
  description:
    "Start practicing several existing problems at once. Pass the ids of already-created problems; they are linked to this chat and shown together for the student to practice. Do not use this to create new problems. Returns the ids.",
  inputSchema: z.object({
    ids: z
      .array(z.string())
      .min(1)
      .describe("IDs of existing problems to practice, one entry per problem."),
  }),
  execute: (input, context) => {
    const tool_call_id = context.toolCallId;
    const chat_id = chatIdStore.getState().chatId;
    const now = new Date();
    const linked: string[] = [];
    input.ids.forEach((id) => {
      if (!problemColl.has(id)) return;
      problemChatRelColl.insert({
        id: genId(),
        pid: id,
        chat_id,
        tool_call_id,
        created_at: now,
        updated_at: now,
      } satisfies ProblemChatRel);
      linked.push(id);
    });

    if (linked.length === 0) {
      throw new Error("None of the given problem ids exist");
    }
    return { ids: linked, chat_id };
  },
});
