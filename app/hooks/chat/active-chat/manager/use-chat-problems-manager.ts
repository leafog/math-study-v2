import { useLiveQuery, eq } from "@tanstack/react-db";
import { useMemo } from "react";
import {
  problemColl,
  answerRecordColl,
  problemExplanationColl,
  answerAnalysisColl,
} from "~/db/tdb-collections";

const useChatProblemsManager = (chatId: string) => {
  const { data: problems } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.chat_id, chatId))
        .orderBy(({ problemColl: col }) => col.created_at, {
          direction: "asc",
        }),
    [chatId],
  );

  const { data: answerRecords } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) => eq(col.chat_id, chatId)),
    [chatId],
  );

  const { data: problemExplanations } = useLiveQuery(
    (q) =>
      q
        .from({ problemExplanationColl })
        .where(({ problemExplanationColl: col }) => eq(col.chat_id, chatId)),
    [chatId],
  );

  const { data: answerAnalysises } = useLiveQuery(
    (q) =>
      q
        .from({ answerAnalysisColl })
        .where(({ answerAnalysisColl: col }) => eq(col.chat_id, chatId)),
    [chatId],
  );
  //   const {} = useLiveQuery(() => {}, []);

  return { problems };
};

export default useChatProblemsManager;
