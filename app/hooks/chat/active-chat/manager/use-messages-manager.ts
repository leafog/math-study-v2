import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { useEffect } from "react";
import { chatMessageColl } from "~/db/tdb-collections";

export const useMessagesManager = (chatId: string) => {
  const { data: initMessages } = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ chatMessageColl })
        .where(({ chatMessageColl }) =>
          eq(chatMessageColl.conversation_id, chatId),
        )
        .orderBy(({ chatMessageColl }) => chatMessageColl.created_at, {
          direction: "asc",
        }),
    [chatId],
  );
  useEffect(() => {
    console.log(initMessages);
  }, [initMessages]);

  return initMessages;
};
