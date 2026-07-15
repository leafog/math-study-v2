import { eq, useLiveSuspenseQuery } from "@tanstack/react-db";
import { messagesColl } from "~/db/tdb-collections";

export const useMessagesManager = (chatId: string) => {
  const { data: initMessages } = useLiveSuspenseQuery(
    (q) =>
      q
        .from({ messagesColl })
        .where(({ messagesColl }) => eq(messagesColl.conversationId, chatId))
        .orderBy(({ messagesColl }) => messagesColl.createdAt, {
          direction: "asc",
        }),
    [chatId],
  );

  return initMessages;
};
