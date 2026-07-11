import { z } from "zod";
import { createCollection } from "@tanstack/react-db";
import type { Collection } from "@tanstack/react-db";
import {
  powerSyncCollectionOptions,
  type PowerSyncCollectionUtils,
} from "@tanstack/powersync-db-collection";
import { APP_SCHEMA, db } from "./pw-db";
import type { Table } from "@powersync/web";

import {
  ProblemSchema,
  PracticeSessionSchema,
  AnswerRecordSchema,
  StudyNoteSchema,
  KnowledgePointSchema,
  KnowledgeEdgeSchema,
  KnowledgeInteractionSchema,
  MasteryScoreSchema,
  PracticeLogSchema,
  TagSchema,
  KnowledgeTagSchema,
  ConversationSchema,
  ChatMessageSchema,
  FileRecordSchema,
  AlbumSchema,
} from "./types";

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
        // SQLite INTEGER → JS boolean
        innerDeser = z.number().transform((v) => v === 1);
        break;
      case "date":
        // SQLite TEXT (ISO string) → JS Date
        innerDeser = z.string().transform((s) => new Date(s));
        break;
      case "array":
      case "object":
        // SQLite TEXT (JSON) → JS array/object
        innerDeser = z.string().transform((v) => JSON.parse(v));
        break;
      default:
        // string / number / enum / date → 保持原样
        innerDeser = field;
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

function mkCol<TTable extends Table, TSchema extends z.ZodType<any, any>>(
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

// ── Collections ────────────────────────────────────────────────

export const problems = mkCol(APP_SCHEMA.props.problems, ProblemSchema);
export const sessions = mkCol(APP_SCHEMA.props.sessions, PracticeSessionSchema);
export const records = mkCol(APP_SCHEMA.props.records, AnswerRecordSchema);
export const notes = mkCol(APP_SCHEMA.props.notes, StudyNoteSchema);
export const knowledge = mkCol(
  APP_SCHEMA.props.knowledge,
  KnowledgePointSchema,
);
export const knowledgeEdges = mkCol(
  APP_SCHEMA.props.knowledgeEdges,
  KnowledgeEdgeSchema,
);
export const knowledgeInteractions = mkCol(
  APP_SCHEMA.props.knowledgeInteractions,
  KnowledgeInteractionSchema,
);
export const masteryScores = mkCol(
  APP_SCHEMA.props.masteryScores,
  MasteryScoreSchema,
);
export const practiceLogs = mkCol(
  APP_SCHEMA.props.practiceLogs,
  PracticeLogSchema,
);
export const tags = mkCol(APP_SCHEMA.props.tags, TagSchema);
export const knowledgeTags = mkCol(
  APP_SCHEMA.props.knowledgeTags,
  KnowledgeTagSchema,
);
export const conversations = mkCol(
  APP_SCHEMA.props.conversations,
  ConversationSchema,
);
export const messages = mkCol(APP_SCHEMA.props.messages, ChatMessageSchema);
export const files = mkCol(APP_SCHEMA.props.files, FileRecordSchema);
export const albums = mkCol(APP_SCHEMA.props.albums, AlbumSchema);
