import { z } from "zod";

// ─── Problem schemas ────────────────────────────────────────────

export const ProblemSchema = z.object({
  id: z.string(),
  content: z.string().describe("Problem body"),
  chat_id: z.string().nullish(),
  description: z
    .string()
    .optional()
    .describe("Brief summary for AI generation or list preview"),
  tags: z
    .array(z.string())
    .describe(
      "IDs of related knowledge-point tags. MUST use existing knowledge-point (KgTopic) IDs, e.g. 'kg_abc123'. Do not invent IDs — only reference topics that already exist in the knowledge graph.",
    ),
  source: z
    .enum(["photo", "latex", "batch", "ai", "manual"])
    .describe("How the problem was created"),
  status: z
    .enum(["unanswered", "correct", "incorrect"])
    .catch("unanswered")
    .describe(
      "Denormalized answer status, maintained by checkAnswer. Avoids join queries on the problem list.",
    ),
  created_at: z.date(),
  updated_at: z.date(),
});
export type Problem = z.infer<typeof ProblemSchema>;

export const ProblemChatRelSchema = z.object({
  id: z.string(),
  pid: z.string(),
  chat_id: z.string(),
  tool_call_id: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type ProblemChatRel = z.infer<typeof ProblemChatRelSchema>;

export const AnswerRecordSchema = z.object({
  id: z.string().describe("Unique answer record ID"),
  problem_id: z.string().describe("Problem ID this answer belongs to"),
  chat_id: z.string().optional().describe("Chat ID where this answer occurred"),
  user_answer: z
    .string()
    .describe(
      "Student's answer, lightly cleaned up with Markdown formatting. " +
        "Keep it simple: fix obvious typos, organize into clear paragraphs or bullet points if the answer is long. " +
        "Wrap any math expressions with $$ delimiters. ",
    ),
  correct: z.boolean().describe("Whether AI judged the answer as correct"),
  knowledge_points: z.array(z.string()).describe("Related knowledge point IDs"),
  time_spent_ms: z.number().describe("Time spent answering in milliseconds"),
  created_at: z.date().describe("When the answer was recorded"),
});
export type AnswerRecord = z.infer<typeof AnswerRecordSchema>;

export const AnswerAnalysisSchema = z.object({
  id: z.string().describe("Unique analysis ID"),
  answer_id: z.string().describe("FK to AnswerRecord"),
  problem_id: z
    .string()
    .nullish()
    .describe("FK to Problem, for batch query by problem"),
  chat_id: z
    .string()
    .nullish()
    .describe("FK to Conversation, for batch query by chat"),
  content: z.string().describe("AI feedback/analysis on this answer. "),
  created_at: z.date(),
});
export type AnswerAnalysis = z.infer<typeof AnswerAnalysisSchema>;

export const ProblemExplanationSchema = z.object({
  id: z.string().describe("Unique explanation ID"),
  problem_id: z.string().describe("FK to Problem"),
  chat_id: z
    .string()
    .nullish()
    .describe("FK to Conversation, for batch query by chat"),
  content: z
    .string()
    .describe("Standard solution/explanation for the problem. "),
  created_at: z.date(),
});
export type ProblemExplanation = z.infer<typeof ProblemExplanationSchema>;

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
      chat_id: z.string().optional(),
      ai_note: z.string().optional(),
    })
    .optional(),
  created_at: z.date(),
});
export type KnowledgeInteraction = z.infer<typeof KnowledgeInteractionSchema>;

// ─── Knowledge Graph Taxonomy (Marble-inspired) ──────────

/** A knowledge node in the graph. Each record is one atomic concept/skill. */
export const KgTopicSchema = z.object({
  id: z.string().describe("Unique ID for this knowledge node, e.g. kg_abc123"),
  name: z
    .string()
    .describe(
      "Canonical English kebab-case identifier, e.g. 'cauchy-mean-value-theorem'. i18n field holds localized display names.",
    ),
  description: z
    .string()
    .describe(
      "Detailed explanation of the concept, generated by AI in English. ",
    ),
  description_i18n: z
    .record(z.string(), z.string())
    .refine((v) => v.zh && v.en, {
      message: "description_i18n must include 'zh' and 'en' keys",
    })
    .describe(
      "MANDATORY: Localized descriptions keyed by language code. Both 'zh' (Chinese) and 'en' (English) are required. e.g. {zh:'柯西中值定理的详细解释', en:'Detailed explanation of Cauchy Mean Value Theorem'}",
    ),
  topic_type: z
    .enum(["conceptual", "procedural", "representational", "language", "meta"])
    .describe(
      "Knowledge type: conceptual=understanding ideas, procedural=how-to methods, representational=diagrams/symbols, language=terminology, meta=learning strategies",
    ),
  subject: z
    .string()
    .describe("Subject area, e.g. 'Algebra', 'Geometry', 'Arithmetic'"),
  domain: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "Sub-domain within subject, e.g. 'Quadratic Equations'. Null if not yet classified",
    ),
  centrality: z
    .number()
    .min(0)
    .max(1)
    .default(0)
    .describe(
      "Graph centrality 0-1. Higher = more connected / foundational. Computed from edge topology",
    ),
  i18n: z
    .record(z.string(), z.string())
    .refine((v) => v.zh && v.en, {
      message: "i18n must include 'zh' and 'en' keys",
    })
    .describe(
      "MANDATORY: Localized display names keyed by language code. Both 'zh' (Chinese) and 'en' (English) are required. e.g. {zh:'柯西中值定理', en:'Cauchy Mean Value Theorem'}",
    ),
  evidence: z
    .string()
    .default("[]")
    .describe(
      'JSON array of observable mastery criteria. Example: \'["Can solve ax²+bx+c=0", "Can derive the formula"]\'',
    ),
  assessment_prompt: z
    .string()
    .nullable()
    .default(null)
    .describe(
      "AI prompt template for generating quiz questions. Use {{name}} as placeholder",
    ),
  age_range_start: z
    .number()
    .int()
    .nullable()
    .default(null)
    .describe("Minimum recommended age/grade. Null if not yet calibrated"),
  age_range_end: z
    .number()
    .int()
    .nullable()
    .default(null)
    .describe("Maximum recommended age/grade. Null if not yet calibrated"),
  created_at: z.date(),
  updated_at: z.date(),
});
export type KgTopic = z.infer<typeof KgTopicSchema>;

/** A prerequisite edge: topic_id requires prerequisite_id to be mastered first. */
export const KgEdgeSchema = z.object({
  id: z.string().describe("Unique ID for this dependency, e.g. ke_abc123"),
  prerequisite_id: z
    .string()
    .describe("Topic that must be mastered first (the prerequisite)"),
  topic_id: z
    .string()
    .describe(
      "Topic that depends on the prerequisite — unlocked after prerequisite is mastered",
    ),
  strength: z
    .enum(["hard", "soft"])
    .describe(
      "hard=strict prerequisite (cannot skip), soft=recommended but flexible",
    ),
  reason: z
    .string()
    .nullable()
    .describe(
      "AI-generated explanation of why this prerequisite exists, in natural language",
    ),
  created_at: z.date(),
});
export type KgEdge = z.infer<typeof KgEdgeSchema>;

/** A domain-level summary grouping related topics (one record per subject+domain). */
export const KgClusterSchema = z.object({
  id: z.string().describe("Unique ID, e.g. kc_abc123"),
  subject: z.string().describe("Subject area, e.g. 'Mathematics'"),
  domain: z
    .string()
    .describe(
      "Domain name used as grouping key, e.g. 'Addition & Subtraction'",
    ),
  age_range_start: z
    .number()
    .int()
    .describe("Recommended starting age for this domain"),
  summary: z
    .string()
    .describe(
      "Human-readable summary of what the learner achieves in this domain, written for parents or teachers",
    ),
  created_at: z.date(),
});
export type KgCluster = z.infer<typeof KgClusterSchema>;

/** A curriculum framework (e.g. UK National Curriculum) with topic-to-standard mappings. */
export const KgCurriculumSchema = z.object({
  id: z.string().describe("Unique ID, e.g. kcu_abc123"),
  slug: z
    .string()
    .describe(
      "URL-friendly unique identifier, e.g. 'uk-national-curriculum-maths'",
    ),
  country: z.string().describe("Country or region code, e.g. 'UK', 'US', 'CN'"),
  name: z
    .string()
    .describe("Full display name, e.g. 'UK National Curriculum — Mathematics'"),
  version: z.string().describe("Version string, e.g. 'v1' or '2014'"),
  source_url: z
    .string()
    .nullable()
    .describe("URL to the official curriculum document"),
  license: z
    .string()
    .nullable()
    .describe("License type, e.g. 'ODbL 1.0'. Null if proprietary"),
  text_included: z
    .boolean()
    .describe(
      "True if the original standard text is stored in the topics JSON",
    ),
  topics: z
    .string()
    .default("[]")
    .describe(
      'JSON array of topic-to-standard mappings: \'[{"key": "topic_id", "code": "standard_code", "data": "original text"}]\'',
    ),
  created_at: z.date(),
});
export type KgCurriculum = z.infer<typeof KgCurriculumSchema>;

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

/** 对话-知识点关联 */
export const ConversationKnowledgePointSchema = z.object({
  id: z.string(),
  chat_id: z.string().nullish(),
  knowledge_point_id: z.string(),
  created_at: z.date(),
});
export type ConversationKnowledgePoint = z.infer<
  typeof ConversationKnowledgePointSchema
>;

/** 对话-知识图谱主题关联 */
export const ChatKgTopicRelSchema = z.object({
  id: z.string(),
  chat_id: z.string().nullish(),
  topic_id: z.string(),
  created_at: z.date(),
});
export type ChatKgTopicRel = z.infer<typeof ChatKgTopicRelSchema>;

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

// ─── Setting model config schemas ──────────────────────────────

/** Per-provider model configuration: base URL, available models, and credentials. */
export const SettingModelConfigSchema = z.object({
  id: z.string(),
  provider_id: z.string().describe("FK to the provider this config belongs to"),
  config_name: z.string().optional().describe("User-facing config name"),
  base_url: z.string().describe("Base URL for the provider's API endpoint"),
  all_models: z
    .array(z.string())
    .optional()
    .describe("All available model identifiers (built-in + custom)"),
  selected_models: z
    .array(z.string())
    .optional()
    .describe("User-selected model identifiers"),
  api_key: z.string().describe("API key for authentication"),
  extra: z
    .record(z.string(), z.any())
    .optional()
    .describe("Flexible key-value pairs for provider-specific settings"),
  created_at: z.date(),
  updated_at: z.date(),
});
export type SettingModelConfig = z.infer<typeof SettingModelConfigSchema>;

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
  chat_id: z.string().nullish(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(z.any()),
  metadata: z
    .object({
      created_at: z.date().optional(),
      reasonings_start_end: z.array(z.string()).optional(),
      practiceProblems: z.array(ProblemSchema).optional(),
    })
    .catchall(z.any())
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

/** 工具运行时产生的数据（如绘图、笔记等），按 chatId 隔离 */
export const ToolDataSchema = z.object({
  id: z.string(),
  chat_id: z.string().nullish(),
  kind: z.string().nullable().optional(),
  data: z.string().nullable().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});
export type ToolData = z.infer<typeof ToolDataSchema>;

export const ChatToolInstanceSchema = z.object({
  id: z.string(),
  chat_id: z.string().nullish(), // 关联到 conversation
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

// ─── Tool output schemas ─────────────────────────────────────────
// Runtime validation for tool execute() return values

export const CreateTopicOutputSchema = z.object({
  success: z.boolean(),
  topic_id: z.string(),
  message: z.string(),
});
export type CreateTopicOutput = z.infer<typeof CreateTopicOutputSchema>;

export const CreateProblemOutputSchema = z.object({
  id: z.string(),
  content: z.string(),
  chat_id: z.string().nullish(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  source: z.enum(["photo", "latex", "batch", "ai", "manual"]),
});
export type CreateProblemOutput = z.infer<typeof CreateProblemOutputSchema>;

export const CreateRelationshipOutputSchema = z.object({
  success: z.boolean(),
  created: z.array(
    z.object({
      id: z.string(),
      prerequisite_id: z.string(),
      topic_id: z.string(),
      strength: z.enum(["hard", "soft"]),
    }),
  ),
  message: z.string(),
});
export type CreateRelationshipOutput = z.infer<
  typeof CreateRelationshipOutputSchema
>;

export const CreateExplanationOutputSchema = z.object({
  success: z.boolean(),
  explanation_id: z.string(),
  message: z.string(),
});
export type CreateExplanationOutput = z.infer<
  typeof CreateExplanationOutputSchema
>;

export const CheckAnswerOutputSchema = z.object({
  success: z.boolean(),
  answer_id: z.string(),
  correct: z.boolean(),
  message: z.string(),
});
export type CheckAnswerOutput = z.infer<typeof CheckAnswerOutputSchema>;

export const LinkTopicsOutputSchema = z.object({
  success: z.boolean(),
  linked: z.array(z.string()),
  skipped: z.array(z.string()),
  message: z.string(),
});
export type LinkTopicsOutput = z.infer<typeof LinkTopicsOutputSchema>;

export const SearchSimilarTopicsOutputSchema = z.object({
  matches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      subject: z.string().optional(),
      description: z.string().optional(),
      i18n: z.record(z.string(), z.string()).optional(),
      similarity: z.number(),
    }),
  ),
  message: z.string(),
});
export type SearchSimilarTopicsOutput = z.infer<
  typeof SearchSimilarTopicsOutputSchema
>;

// ─── Zustand persist ────────────────────────────────────────────

export const ZustandStorageSchema = z.object({
  id: z.string(),
  value: z.string(),
  updated_at: z.date(),
});

export type ZustandStorage = z.infer<typeof ZustandStorageSchema>;
