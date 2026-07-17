import { z } from "zod";

// ─── Problem schemas ────────────────────────────────────────────

export const ProblemSchema = z.object({
  id: z.string(),
  content: z.string(),
  latex: z.string().optional(),
  tags: z.array(z.string()),
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  source: z.enum(["photo", "latex", "batch", "ai", "manual"]),
  image_blob: z.string().optional(),
  content_hash: z.string().optional(),
  variant_of: z.string().optional(),
  variant_type: z.enum(["harder", "easier", "similar"]).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Problem = z.infer<typeof ProblemSchema>;

// ─── Practice schemas ───────────────────────────────────────────

export const PracticeSessionSchema = z.object({
  id: z.string(),
  problem_id: z.string(),
  mode: z.enum(["variant", "adaptive", "error-repractice"]),
  status: z.enum(["active", "completed", "abandoned"]),
  started_at: z.date(),
  completed_at: z.date().optional(),
});
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

export const AnswerRecordSchema = z.object({
  id: z.string(),
  problem_id: z.string(),
  session_id: z.string().optional(),
  user_answer: z.string(),
  correct: z.boolean(),
  knowledge_points: z.array(z.string()),
  time_spent_ms: z.number(),
  created_at: z.date(),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const StudyNoteSchema = z.object({
  id: z.string(),
  problem_id: z.string(),
  content: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type StudyNote = z.infer<typeof StudyNoteSchema>;

// ─── Knowledge graph schemas ────────────────────────────────────

export const KnowledgePointSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type KnowledgePoint = z.infer<typeof KnowledgePointSchema>;

export const KnowledgeEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  created_at: z.date(),
});
export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;

export const KnowledgeInteractionSchema = z.object({
  id: z.string(),
  knowledge_point_id: z.string(),
  problem_id: z.string().optional(),
  type: z.enum([
    "practice_correct",
    "practice_wrong",
    "hint_requested",
    "explanation_viewed",
    "weakness_flagged",
    "review_suggested",
    "user_confused",
    "user_understood",
    "user_requested_explanation",
    "user_asked_why",
  ]),
  source: z.enum([
    "check_answer",
    "hint",
    "ai_detect",
    "system",
    "user_feedback",
  ]),
  metadata: z
    .object({
      correct: z.boolean().optional(),
      time_spent_ms: z.number().optional(),
      conversation_id: z.string().optional(),
      ai_note: z.string().optional(),
    })
    .optional(),
  created_at: z.date(),
});
export type KnowledgeInteraction = z.infer<typeof KnowledgeInteractionSchema>;

/** 掌握度评分（程序维护，规则引擎驱动） */
export const MasteryScoreSchema = z.object({
  id: z.string(),
  score: z.number().int().min(0).max(100),
  total_attempts: z.number().int(),
  correct_count: z.number().int(),
  hint_count: z.number().int(),
  last_practiced_at: z.date().nullable(),
  next_review_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type MasteryScore = z.infer<typeof MasteryScoreSchema>;

/** 练习日志（LLM 结构化判断 + 程序记录） */
export const PracticeLogSchema = z.object({
  id: z.string(),
  knowledge_point_id: z.string(),
  problem_id: z.string().nullable(),
  understood: z.boolean(),
  error_type: z
    .enum(["conceptual", "calculation", "careless", "incomplete"])
    .nullable(),
  hint_dependent: z.boolean(),
  misconception: z.string().nullable(),
  next_action: z.enum(["continue", "review", "advance", "switch_topic"]),
  created_at: z.date(),
});
export type PracticeLog = z.infer<typeof PracticeLogSchema>;

// ─── Tag schemas ────────────────────────────────────────────────

/** 标签（老师/AI 创建，用于标记知识点） */
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Tag = z.infer<typeof TagSchema>;

/** 知识点-标签关联 */
export const KnowledgeTagSchema = z.object({
  id: z.string(),
  knowledge_point_id: z.string(),
  tag_id: z.string(),
  created_at: z.date(),
});
export type KnowledgeTag = z.infer<typeof KnowledgeTagSchema>;

/** 对话-知识点关联 */
export const ConversationKnowledgePointSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  knowledge_point_id: z.string(),
  created_at: z.date(),
});
export type ConversationKnowledgePoint = z.infer<
  typeof ConversationKnowledgePointSchema
>;

// ─── Provider / API config schemas ──────────────────────────────

export const ApiConfigSchema = z.object({
  id: z.string(),
  provider: z.enum(["deepseek", "openai", "anthropic", "qwen"]),
  label: z.string(),
  api_endpoint: z.string(),
  api_key: z.string(),
  model: z.string(),
});
export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export const AppSettingsSchema = z.object({
  id: z.string(),
  configs: z.array(ApiConfigSchema),
  active_config_id: z.string(),
  model: z.string(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// ─── Conversation schemas ───────────────────────────────────────

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.any()),
  metadata: z
    .object({
      created_at: z.date(),
    })
    .optional(),
  created_at: z.date().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ─── File / Album schemas ───────────────────────────────────────

export const FileRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  media_type: z.string(),
  size: z.number(),
  blob: z.string(),
  thumbnail: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  hash: z.string().optional(),
  source: z.enum(["upload", "camera", "paste"]),
  problem_ids: z.array(z.string()),
  album_ids: z.array(z.string()),
  created_at: z.date(),
});
export type FileRecord = z.infer<typeof FileRecordSchema>;

export const AlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  cover_file_id: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Album = z.infer<typeof AlbumSchema>;

/**
 * PowerSync AttachmentTable schema (localOnly, used for attachment sync).
 * Keys use snake_case to match PowerSync's SQL column names.
 * @see AttachmentTable from @powersync/web
 */
export const AttachmentSchema = z.object({
  id: z.string(),
  filename: z.string().optional(),
  local_uri: z.string().optional(),
  timestamp: z.number().optional(),
  size: z.number().optional(),
  media_type: z.string().optional(),
  state: z.number().int().min(0).max(4).optional(),
  has_synced: z.boolean().optional(),
  meta_data: z.string().optional(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const ChatToolInstanceSchema = z.object({
  id: z.string(),
  conversation_id: z.string(), // 关联到 conversation
  kind: z.string(), // "excalidraw" | "calculator" | "reference-viewer"
  title: z.string(), // tab 上显示的标题
  data: z.any(), // JSON — 工具自己的数据，按 kind 不同结构不同
  created_at: z.date(),
  updated_at: z.date(),
});
export type ChatToolInstance = z.infer<typeof ChatToolInstanceSchema>;

export const ChatToolsBarStateSchema = z.object({
  id: z.string(),
  active_id: z.string().optional(),
  tool_order: z.array(z.string()),
  actived_history: z.array(z.string()),
});

export type ChatToolsBarState = z.infer<typeof ChatToolsBarStateSchema>;

// ─── Zustand persist ────────────────────────────────────────────

export const ZustandStorageSchema = z.object({
  id: z.string(),
  value: z.string(),
  updated_at: z.date(),
});

export type ZustandStorage = z.infer<typeof ZustandStorageSchema>;
