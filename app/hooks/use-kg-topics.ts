import { useLiveQuery } from "@tanstack/react-db";
import { mapKeys } from "lodash-es";
import { kgTopicColl } from "~/db/tdb-collections";

const useKgTopics = () => {
  const { data: topics = [] } = useLiveQuery((q) => q.from({ kgTopicColl }));
  const topicsMap = mapKeys(topics, (it) => it.id);
  const idToTopic = (id: string) => topicsMap[id];
  const idsToTopics = (ids: string[]) => ids.map((it) => topicsMap[it]);
  return {
    topics,
    idToTopic,
    idsToTopics,
  };
};

export default useKgTopics;
