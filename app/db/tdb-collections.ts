import { z } from "zod";
import { createCollection } from "@tanstack/react-db";
import type { Collection } from "@tanstack/react-db";
import {
  powerSyncCollectionOptions,
  type PowerSyncCollectionUtils,
} from "@tanstack/powersync-db-collection";
import { schemas, db, AppSchema } from "./pw-db";
import type { SchemaMap } from "./pw-db";
import type { Table } from "@powersync/web";

import { zipObject } from "lodash-es";

// ── 自动生成 deserializationSchema ──────────────────────────────
// 将 rich schema 中的 z.boolean() → z.number().transform(...)
// z.array() / z.object() → z.string().transform(JSON.parse)
// 其余保持原样

/** 剥离所有 nullable / optional 包装，返回裸类型 + 包装链（外层→内层） */
function collectWrappers(f: any): {
  raw: any;
  wrappers: Array<"nullable" | "optional">;
} {
  const wrappers: Array<"nullable" | "optional"> = [];
  let inner = f;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodNullable) {
    if (inner instanceof z.ZodNullable) wrappers.push("nullable");
    if (inner instanceof z.ZodOptional) wrappers.push("optional");
    inner = inner.unwrap();
  }
  if (inner._def?.type === "default") inner = inner._def.innerType;
  return { raw: inner, wrappers };
}

function makeDeserSchema(schema: z.ZodObject<any>): z.ZodObject<any> {
  const shape: any = schema._def.shape;
  const deser: Record<string, z.ZodType> = {};

  for (const key of Object.keys(shape)) {
    const field = shape[key];

    const { raw, wrappers } = collectWrappers(field);

    let innerDeser: z.ZodType;

    switch (raw._def?.type) {
      case "boolean":
        // SQLite INTEGER → JS boolean（可能为 NULL）
        innerDeser = z
          .number()
          .nullable()
          .transform((v) => (v === null ? null : v === 1));
        break;
      case "date":
        // SQLite TEXT (ISO string) → JS Date（可能为 NULL）
        innerDeser = z
          .string()
          .nullable()
          .transform((s) => (s === null ? null : new Date(s)));
        break;
      case "array":
      case "object":
        // SQLite TEXT (JSON) → JS array/object（可能为 NULL）
        innerDeser = z
          .string()
          .nullable()
          .transform((v) => (v === null ? null : JSON.parse(v)));
        break;
      case "record":
        // SQLite TEXT (JSON) → JS Record，NULL → {} 兼容旧数据
        innerDeser = z
          .string()
          .nullable()
          .transform((v) => (v === null ? {} : JSON.parse(v)));
        break;
      default:
        // SQLite 将 undefined 存为 null，读回时转回 undefined
        if (wrappers.includes("optional") && !wrappers.includes("nullable")) {
          innerDeser = raw.nullable().transform((v: any) => v ?? undefined);
        } else {
          innerDeser = field;
        }
        break;
    }

    // 对于保持原样的字段，直接用 field（包含所有包装）
    if (innerDeser === field) {
      deser[key] = field;
      continue;
    }

    // 从内到外重新套回 nullable / optional 包装
    let result = innerDeser;
    for (let i = wrappers.length - 1; i >= 0; i--) {
      if (wrappers[i] === "nullable") result = result.nullable();
      if (wrappers[i] === "optional") result = result.optional();
    }
    deser[key] = result;
  }

  return z.object(deser);
}

// ── Collection 工厂 ────────────────────────────────────────────

/** 从 Zod schema 中提取 output / input 类型 */
type ZodOutput<T extends z.ZodType<any, any>> = T["_zod"]["output"];
type ZodInput<T extends z.ZodType<any, any>> = T["_zod"]["input"];

function mkColl<TTable extends Table, TSchema extends z.ZodType<any, any>>(
  table: TTable,
  schema: TSchema,
): Collection<
  ZodOutput<TSchema>,
  string,
  PowerSyncCollectionUtils<TTable>,
  TSchema,
  ZodInput<TSchema>
> {
  const deserSchema = makeDeserSchema(schema as any);
  return createCollection(
    powerSyncCollectionOptions({
      database: db,
      table,
      schema,
      deserializationSchema: deserSchema as any,
      onDeserializationError: (error: any) => {
        console.error(`Deserialization error:`, error);
      },
    }) as any,
  );
}

// ── CollMap 类型 ─────────────────────────────────────────────

type CollMap = {
  [K in keyof SchemaMap as K extends string ? `${K}Coll` : never]: Collection<
    ZodOutput<SchemaMap[K]>,
    string,
    PowerSyncCollectionUtils<Table>,
    SchemaMap[K],
    ZodInput<SchemaMap[K]>
  >;
};

// ── 程序生成 ─────────────────────────────────────────────────

const schemaKeys = Object.keys(schemas) as Array<keyof SchemaMap>;
const collKeys = schemaKeys.map((k) => `${k}Coll`);
const collValues = schemaKeys.map((k) =>
  mkColl(AppSchema.props[k], schemas[k]),
);

export const colls = zipObject(collKeys, collValues) as unknown as CollMap;

export const {
  problemColl,
  practiceSessionColl,
  answerRecordColl,
  studyNoteColl,
  knowledgePointColl,
  knowledgeEdgeColl,
  knowledgeInteractionColl,
  masteryScoreColl,
  practiceLogColl,
  tagColl,
  knowledgeTagColl,
  conversationColl,
  chatMessageColl,
  fileRecordColl,
  albumColl,
  chatToolInstanceColl,
  chatToolsBarStateColl,
  zustandStorageColl,
  attachmentColl,
  kgTopicColl,
  kgEdgeColl,
  kgClusterColl,
  kgCurriculumColl,
  conversationKgTopicColl,
  toolDataColl,
} = colls;
