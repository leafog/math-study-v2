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
  imageBlob: z.string().optional(),
  contentHash: z.string().optional(),
  variantOf: z.string().optional(),
  variantType: z.enum(["harder", "easier", "similar"]).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Problem = z.infer<typeof ProblemSchema>;

// ─── Practice schemas ───────────────────────────────────────────

export const PracticeSessionSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  mode: z.enum(["variant", "adaptive", "error-repractice"]),
  status: z.enum(["active", "completed", "abandoned"]),
  startedAt: z.date(),
  completedAt: z.date().optional(),
});
export type PracticeSession = z.infer<typeof PracticeSessionSchema>;

export const AnswerRecordSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  sessionId: z.string().optional(),
  userAnswer: z.string(),
  correct: z.boolean(),
  knowledgePoints: z.array(z.string()),
  timeSpentMs: z.number(),
  createdAt: z.date(),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const StudyNoteSchema = z.object({
  id: z.string(),
  problemId: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StudyNote = z.infer<typeof StudyNoteSchema>;

// ─── Knowledge graph schemas ────────────────────────────────────

export const KnowledgePointSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type KnowledgePoint = z.infer<typeof KnowledgePointSchema>;

export const KnowledgeEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  createdAt: z.date(),
});
export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;

export const KnowledgeInteractionSchema = z.object({
  id: z.string(),
  knowledgePointId: z.string(),
  problemId: z.string().optional(),
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
      timeSpentMs: z.number().optional(),
      conversationId: z.string().optional(),
      aiNote: z.string().optional(),
    })
    .optional(),
  createdAt: z.date(),
});
export type KnowledgeInteraction = z.infer<typeof KnowledgeInteractionSchema>;

/** 掌握度评分（程序维护，规则引擎驱动） */
export const MasteryScoreSchema = z.object({
  id: z.string(),
  score: z.number().int().min(0).max(100),
  totalAttempts: z.number().int(),
  correctCount: z.number().int(),
  hintCount: z.number().int(),
  lastPracticedAt: z.date().nullable(),
  nextReviewAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type MasteryScore = z.infer<typeof MasteryScoreSchema>;

/** 练习日志（LLM 结构化判断 + 程序记录） */
export const PracticeLogSchema = z.object({
  id: z.string(),
  knowledgePointId: z.string(),
  problemId: z.string().nullable(),
  understood: z.boolean(),
  errorType: z
    .enum(["conceptual", "calculation", "careless", "incomplete"])
    .nullable(),
  hintDependent: z.boolean(),
  misconception: z.string().nullable(),
  nextAction: z.enum(["continue", "review", "advance", "switch_topic"]),
  createdAt: z.date(),
});
export type PracticeLog = z.infer<typeof PracticeLogSchema>;

// ─── Tag schemas ────────────────────────────────────────────────

/** 标签（老师/AI 创建，用于标记知识点） */
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Tag = z.infer<typeof TagSchema>;

/** 知识点-标签关联 */
export const KnowledgeTagSchema = z.object({
  id: z.string(),
  knowledgePointId: z.string(),
  tagId: z.string(),
  createdAt: z.date(),
});
export type KnowledgeTag = z.infer<typeof KnowledgeTagSchema>;

/** 对话-知识点关联 */
export const ConversationKnowledgePointSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  knowledgePointId: z.string(),
  createdAt: z.date(),
});
export type ConversationKnowledgePoint = z.infer<
  typeof ConversationKnowledgePointSchema
>;

// ─── Provider / API config schemas ──────────────────────────────

export const PROVIDERS = [
  {
    id: "deepseek",
    label: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1",
    models: ["deepseek-v4-flash", "deepseek-v4-pro"],
  },
  {
    id: "openai",
    label: "OpenAI",
    endpoint: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini"],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    endpoint: "https://api.anthropic.com/v1",
    models: ["claude-sonnet-4-6", "claude-haiku-4-5"],
  },
  {
    id: "qwen",
    label: "通义千问",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen-plus", "qwen-max"],
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

export const ApiConfigSchema = z.object({
  id: z.string(),
  provider: z.enum(["deepseek", "openai", "anthropic", "qwen"]),
  label: z.string(),
  apiEndpoint: z.string(),
  apiKey: z.string(),
  model: z.string(),
});
export type ApiConfig = z.infer<typeof ApiConfigSchema>;

export const AppSettingsSchema = z.object({
  id: z.string(),
  configs: z.array(ApiConfigSchema),
  activeConfigId: z.string(),
  model: z.string(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

// ─── Conversation schemas ───────────────────────────────────────

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

/** 聊天工具面板状态 */
export const ChatToolsPanelStateSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  toolsSize: z.object({
    asPercentage: z.number(),
    inPixels: z.number(),
  }),
  chatSize: z.object({
    asPercentage: z.number(),
    inPixels: z.number(),
  }),
  restoreChatPercentage: z.string(),
  restoreToolsPercentage: z.string(),
  zenMode: z.boolean(),
  toolsShow: z.boolean(),
});
export type ChatToolsPanelState = z.infer<
  typeof ChatToolsPanelStateSchema
>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.any()),
  metadata: z
    .object({
      createdAt: z.date(),
    })
    .optional(),
  createdAt: z.date().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ─── File / Album schemas ───────────────────────────────────────

export const FileRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  mediaType: z.string(),
  size: z.number(),
  blob: z.string(),
  thumbnail: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  hash: z.string().optional(),
  source: z.enum(["upload", "camera", "paste"]),
  problemIds: z.array(z.string()),
  albumIds: z.array(z.string()),
  createdAt: z.date(),
});
export type FileRecord = z.infer<typeof FileRecordSchema>;

export const AlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  coverFileId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Album = z.infer<typeof AlbumSchema>;
