import { z } from "zod";
import { column, PowerSyncDatabase, Schema, Table } from "@powersync/web";
import * as S from "./types";

// ── Zod → PowerSync column type ─────────────────────────────────

/** 从 Zod type 自动推导 PowerSync column type */
function getColumnType(type: z.ZodTypeAny) {
  // 剥除外层 optional / nullable / default 包装
  let inner: any = type;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodNullable) {
    inner = inner.unwrap();
  }
  if (inner._def?.type === "default") inner = inner._def.innerType;

  const rawType = inner._def?.type;

  switch (rawType) {
    case "string":
      return column.text;
    case "number": {
      // z.number().int() → column.integer，其余 → column.real
      const checks = inner._def?.checks ?? [];
      return checks.some((c: any) => c.kind === "int")
        ? column.integer
        : column.real;
    }
    case "boolean":
      return column.integer;
    case "date":
      return column.text;
    case "enum":
      return column.text;
    case "union": {
      // z.union([z.literal(1), z.literal(2), ...]) → integer
      const options = inner._def?.options ?? [];
      if (
        Array.isArray(options) &&
        options.length > 0 &&
        options.every(
          (o: any) =>
            o._def?.type === "literal" &&
            typeof o._def?.value === "number" &&
            Number.isInteger(o._def?.value),
        )
      ) {
        return column.integer;
      }
      return column.text;
    }
    case "literal": {
      const val = inner._def?.value;
      if (typeof val === "number") {
        return Number.isInteger(val) ? column.integer : column.real;
      }
      return column.text;
    }
    case "array":
    case "object":
    case "record":
    case "json":
      return column.text;
    default:
      return column.text;
  }
}

function toTable(schema: z.ZodObject<any>): Table {
  const shape =
    typeof schema.shape === "function" ? schema.shape() : schema.shape;
  const columns: Record<string, any> = {};
  for (const key of Object.keys(shape)) {
    columns[key] = getColumnType(shape[key]);
  }
  return new Table(columns);
}

// ── 表名 → Zod schema 映射 ─────────────────────────────────────

const tableSchemas = {
  problems: S.ProblemSchema,
  sessions: S.PracticeSessionSchema,
  records: S.AnswerRecordSchema,
  notes: S.StudyNoteSchema,
  knowledge: S.KnowledgePointSchema,
  knowledgeEdges: S.KnowledgeEdgeSchema,
  knowledgeInteractions: S.KnowledgeInteractionSchema,
  masteryScores: S.MasteryScoreSchema,
  practiceLogs: S.PracticeLogSchema,
  tags: S.TagSchema,
  knowledgeTags: S.KnowledgeTagSchema,
  conversations: S.ConversationSchema,
  messages: S.ChatMessageSchema,
  files: S.FileRecordSchema,
  albums: S.AlbumSchema,
  chatToolsPanelStates: S.ChatToolsPanelStateSchema,
} as const;

// ── PowerSync schema ───────────────────────────────────────────

export const AppSchema = new Schema(
  Object.fromEntries(
    Object.entries(tableSchemas).map(([name, schema]) => [
      name,
      toTable(schema),
    ]),
  ),
);

// ── Database instance ─────────────────────────────────────────

export const db = new PowerSyncDatabase({
  database: {
    dbFilename: "math-study-v2.db",
  },
  schema: AppSchema,
});
