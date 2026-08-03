import { eq, useLiveQuery } from "@tanstack/react-db";

import { kgTopicColl, kgEdgeColl, chatKgTopicColl } from "~/db/tdb-collections";

const useChatKgTopicsManager = (chatId: string) => {
  const { data: allTopics = [] } = useLiveQuery((q) => q.from({ kgTopicColl }));
  const { data: allEdges = [] } = useLiveQuery((q) => q.from({ kgEdgeColl }));

  const { data: chatKgTopics = [] } = useLiveQuery(
    (q) =>
      q
        .from({ chatKgTopicColl })
        .where(({ chatKgTopicColl }) => eq(chatKgTopicColl.chat_id, chatId)),
    [chatId],
  );
  return {};
};

export default useChatKgTopicsManager;
