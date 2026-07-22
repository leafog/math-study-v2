import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";

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

  return initMessages;
};
