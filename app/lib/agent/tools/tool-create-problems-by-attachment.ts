import { tool } from "ai";
import { z } from "zod";
import { eq, queryOnce } from "@tanstack/react-db";
import { problemChatRelColl, problemColl } from "~/db/tdb-collections";
import {
  ProblemSchema,
  type Problem,
  type ProblemChatRel,
} from "~/db/db-zod-schema";
import { genId } from "~/lib/id-utils";
import { chatIdStore } from "~/store/chat-id-store";

// 按附件批量建题：一次调用把“某个附件里抽出的所有题”建完。
// 每题强制打上该附件的归属(source=photo + source_attachment_id),
// 这样列表可据此按附件分组,也能逐题判题/溯源/去重。
const AttachmentProblemSchema = ProblemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  status: true,
  source: true,
  source_attachment_id: true,
});

const CreateProblemsByAttachmentOutputSchema = z.object({
  created: z.number().describe("Number of problems created"),
  ids: z.array(z.string()).describe("IDs of the created problems"),
  chat_id: z.string().nullish(),
});

export const createProblemsByAttachment = tool({
  description:
    "Create all the practice problems extracted from a single uploaded attachment (photo / scanned sheet). Pass the attachment_id and every problem found in that attachment, one entry per problem in the problems array. All created problems are automatically linked to that attachment. Returns a compact summary — do not repeat the problem contents after calling.",
  inputSchema: z.object({
    attachment_id: z
      .string()
      .describe(
        "The id of the attachment these problems were extracted from (OCR).",
      ),
    problems: z
      .array(AttachmentProblemSchema)
      .min(1)
      .describe(
        "Every problem extracted from this attachment. One entry per problem.",
      ),
  }),
  execute: (input, context) => {
    const chat_id = chatIdStore.getState().chatId;
    const now = new Date();
    const tool_call_id = context.toolCallId;
    const ids: string[] = [];

    input.problems.forEach((item, i) => {
      const pid = genId();

      problemColl.insert({
        ...item,
        id: pid,
        chat_id,
        source: "photo" as const,
        source_attachment_id: input.attachment_id,
        status: "unanswered" as const,
        created_at: now,
        updated_at: now,
      } satisfies Problem);

      problemChatRelColl.insert({
        id: genId(),
        pid,
        chat_id,
        tool_call_id,
        sort_order: i,
        created_at: now,
        updated_at: now,
      } satisfies ProblemChatRel);
      ids.push(pid);
    });

    return CreateProblemsByAttachmentOutputSchema.parse({
      created: ids.length,
      ids,
      chat_id,
    });
  },
});
