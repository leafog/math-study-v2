import {
  create,
  insert,
  insertMultiple,
  remove,
  search,
  update,
} from "@orama/orama";
import type { KgTopic } from "~/db/db-zod-schema";

const topicDb = create({
  schema: {
    id: "string",
    name: "string",
  },
});

let initialized = false;

/** 首次启动：全量导入所有 topic，重复调用自动跳过 */
export const initOrama = async (kgTopics: KgTopic[]) => {
  if (initialized) return;
  if (kgTopics.length === 0) return;
  initialized = true;

  const docs = kgTopics.map((it) => ({
    id: it.id,
    name: it.name,
  }));
  await insertMultiple(topicDb, docs);
};

/** 增量：新建 topic */
export const insertTopic = (topic: Pick<KgTopic, "id" | "name">) => {
  return insert(topicDb, { id: topic.id, name: topic.name });
};

/** 增量：删除 topic */
export const removeTopic = (id: string) => {
  return remove(topicDb, id);
};
export const updateTopic = (topic: Pick<KgTopic, "id" | "name">) => {
  return update(topicDb, topic.id, { name: topic.name });
};

export const searchTopics = (term: string) => {
  return search(topicDb, {
    term,
    properties: ["name"],
  });
};
