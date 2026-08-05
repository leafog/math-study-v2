import { eq, useLiveQuery } from "@tanstack/react-db";

import { chatMessageColl } from "~/db/tdb-collections";

export const useMessagesManager = (chatId: string) => {
  const { data: initMessages } = useLiveQuery(
    {
      query: (q) =>
        q
          .from({ chatMessageColl })
          .where(({ chatMessageColl }) => eq(chatMessageColl.chat_id, chatId))
          .orderBy(({ chatMessageColl }) => chatMessageColl.created_at, {
            direction: "asc",
          }),
      gcTime: 60_000,
    },
    [chatId],
  );

  return initMessages;
};
