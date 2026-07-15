import { z } from "zod";
import { createCollection } from "@tanstack/react-db";
import type { Collection } from "@tanstack/react-db";
import {
  powerSyncCollectionOptions,
  type PowerSyncCollectionUtils,
} from "@tanstack/powersync-db-collection";
import { AppSchema, db } from "./pw-db";
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
  ChatToolInstanceSchema,
  ChatToolsBarStateSchema,
  ZustandStorageSchema,
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

// ── Collections ────────────────────────────────────────────────

export const problemsColl = mkColl(AppSchema.props.problems, ProblemSchema);
export const sessionsColl = mkColl(
  AppSchema.props.sessions,
  PracticeSessionSchema,
);
export const recordsColl = mkColl(AppSchema.props.records, AnswerRecordSchema);
export const notesColl = mkColl(AppSchema.props.notes, StudyNoteSchema);
export const knowledgeColl = mkColl(
  AppSchema.props.knowledge,
  KnowledgePointSchema,
);
export const knowledgeEdgesColl = mkColl(
  AppSchema.props.knowledgeEdges,
  KnowledgeEdgeSchema,
);
export const knowledgeInteractionsColl = mkColl(
  AppSchema.props.knowledgeInteractions,
  KnowledgeInteractionSchema,
);
export const masteryScoresColl = mkColl(
  AppSchema.props.masteryScores,
  MasteryScoreSchema,
);
export const practiceLogsColl = mkColl(
  AppSchema.props.practiceLogs,
  PracticeLogSchema,
);
export const tagsColl = mkColl(AppSchema.props.tags, TagSchema);
export const knowledgeTagsColl = mkColl(
  AppSchema.props.knowledgeTags,
  KnowledgeTagSchema,
);
export const conversationsColl = mkColl(
  AppSchema.props.conversations,
  ConversationSchema,
);
export const messagesColl = mkColl(AppSchema.props.messages, ChatMessageSchema);
export const filesColl = mkColl(AppSchema.props.files, FileRecordSchema);
export const albumsColl = mkColl(AppSchema.props.albums, AlbumSchema);
export const chatToolInstancesColl = mkColl(
  AppSchema.props.chatToolInstances,
  ChatToolInstanceSchema,
);
export const chatToolsBarStateColl = mkColl(
  AppSchema.props.chatToolPanelActive,
  ChatToolsBarStateSchema,
);
export const zustandStorageColl = mkColl(
  AppSchema.props.zustandStorage,
  ZustandStorageSchema,
);
