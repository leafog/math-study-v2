import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { chatMessageColl } from "~/db/tdb-collections";

export const useMessagesManager = (chatId: string) => {
  const { data: initMessages } = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ chatMessageColl })
        .where(({ chatMessageColl }) =>
          eq(chatMessageColl.conversationId, chatId),
        )
        .orderBy(({ chatMessageColl }) => chatMessageColl.createdAt, {
          direction: "asc",
        }),
    [chatId],
  );

  return initMessages;
};
