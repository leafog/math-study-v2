import Dexie, { type EntityTable } from "dexie";

// ─── Types ───────────────────────────────────────────────────

export interface Problem {
  id: string;
  content: string; // LaTeX / plain text
  latex?: string; // raw LaTeX source
  tags: string[]; // knowledge point tags
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: "photo" | "latex" | "batch" | "ai" | "manual";
  imageBlob?: Blob; // original photo if imported from camera
  contentHash?: string; // SHA-256 of content, for dedup
  variantOf?: string; // original problem ID this is a variant of
  variantType?: "harder" | "easier" | "similar";
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeSession {
  id: string;
  problemId: string;
  mode: "variant" | "adaptive" | "error-repractice";
  status: "active" | "completed" | "abandoned";
  startedAt: Date;
  completedAt?: Date;
}

export interface AnswerRecord {
  id: string;
  problemId: string;
  sessionId?: string;
  userAnswer: string; // LaTeX or text
  correct: boolean;
  knowledgePoints: string[];
  timeSpentMs: number;
  createdAt: Date;
}

export interface StudyNote {
  id: string;
  problemId: string;
  content: string; // Markdown + LaTeX
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgePoint {
  id: string; // tag 值（唯一标识）
  name: string; // 显示名称
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeEdge {
  id: string;
  source: string; // 源节点 tag
  target: string; // 目标节点 tag
  type: string; // 关系类型: "parent" | "prerequisite" | "related" | "sequence"
  createdAt: Date;
}

export interface KnowledgeInteraction {
  id: string;
  knowledgePointId: string;
  problemId?: string;
  type:
    | "practice_correct"
    | "practice_wrong"
    | "hint_requested"
    | "explanation_viewed"
    | "weakness_flagged"
    | "review_suggested"
    | "user_confused"
    | "user_understood"
    | "user_requested_explanation"
    | "user_asked_why";
  source: "check_answer" | "hint" | "ai_detect" | "system" | "user_feedback";
  metadata?: {
    correct?: boolean;
    timeSpentMs?: number;
    conversationId?: string;
    aiNote?: string;
  };
  createdAt: Date;
}

/** 掌握度评分（程序维护，规则引擎驱动） */
export interface MasteryScore {
  id: string; // knowledgePointId
  score: number; // 0-100
  totalAttempts: number; // 总练习次数
  correctCount: number; // 连续正确次数（streak）
  hintCount: number; // 使用提示次数
  lastPracticedAt: Date | null;
  nextReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 标签（老师/AI 创建，用于标记知识点） */
export interface Tag {
  id: string;
  name: string; // 显示名称，如 "不熟悉"、"重点"、"易错"
  color?: string; // 可选颜色
  description?: string; // 可选描述
  createdAt: Date;
  updatedAt: Date;
}

/** 知识点-标签关联 */
export interface KnowledgeTag {
  id: string;
  knowledgePointId: string;
  tagId: string;
  createdAt: Date;
}

/** 对话-知识点关联 */
export interface ConversationKnowledgePoint {
  id: string;
  conversationId: string;
  knowledgePointId: string;
  createdAt: Date;
}

/** 练习日志（LLM 结构化判断 + 程序记录） */
export interface PracticeLog {
  id: string;
  knowledgePointId: string;
  problemId: string | null;
  // LLM 输出
  understood: boolean;
  errorType: "conceptual" | "calculation" | "careless" | "incomplete" | null;
  hintDependent: boolean;
  misconception: string | null;
  nextAction: "continue" | "review" | "advance" | "switch_topic";
  // 元数据
  createdAt: Date;
}

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

export interface ApiConfig {
  id: string;
  provider: ProviderId;
  label: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
}

export interface AppSettings {
  id: string;
  configs: ApiConfig[];
  activeConfigId: string;
  model: string;
}

// ─── Conversation types ──────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  problemIds?: string[];
  fileIds?: string[];
  partsJson?: string;
  createdAt: Date;
}

// ─── File types ──────────────────────────────────────────────

export interface FileRecord {
  id: string;
  name: string;
  mediaType: string;
  size: number;
  blob: Blob;
  thumbnail?: Blob;
  width?: number;
  height?: number;
  hash?: string; // SHA-256 for dedup
  source: "upload" | "camera" | "paste";
  problemIds: string[];
  albumIds: string[];
  createdAt: Date;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverFileId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Database ────────────────────────────────────────────────

const db = new Dexie("MathStudyDB") as Dexie & {
  problems: EntityTable<Problem, "id">;
  sessions: EntityTable<PracticeSession, "id">;
  records: EntityTable<AnswerRecord, "id">;
  notes: EntityTable<StudyNote, "id">;
  knowledge: EntityTable<KnowledgePoint, "id">;
  knowledgeEdges: EntityTable<KnowledgeEdge, "id">;
  settings: EntityTable<AppSettings, "id">;
  conversations: EntityTable<Conversation, "id">;
  messages: EntityTable<ChatMessage, "id">;
  files: EntityTable<FileRecord, "id">;
  albums: EntityTable<Album, "id">;
  knowledgeInteractions: EntityTable<KnowledgeInteraction, "id">;
  // Legacy BKT tables (kept for migration)
  bktMastery: EntityTable<{ id: string; [key: string]: unknown }, "id">;
  forgettingSync: EntityTable<{ id: string; [key: string]: unknown }, "id">;
  // New mastery system
  masteryScores: EntityTable<MasteryScore, "id">;
  practiceLogs: EntityTable<PracticeLog, "id">;
  // Tags system
  tags: EntityTable<Tag, "id">;
  knowledgeTags: EntityTable<KnowledgeTag, "id">;
  conversationKnowledgePoints: EntityTable<ConversationKnowledgePoint, "id">;
};

db.version(1).stores({
  problems: "id, *tags, difficulty, source, createdAt, contentHash",
  sessions: "id, problemId, mode, status, startedAt",
  records: "id, problemId, correct, createdAt, *knowledgePoints",
  notes: "id, problemId, createdAt",
  knowledge: "id, name, description, createdAt, updatedAt",
  knowledgeEdges: "id, source, target, type, createdAt",
  knowledgeInteractions: "id, knowledgePointId, type, createdAt",
  masteryScores: "id, score, lastPracticedAt, nextReviewAt",
  practiceLogs: "id, knowledgePointId, problemId, understood, createdAt",
  tags: "id, name, createdAt",
  knowledgeTags: "id, knowledgePointId, tagId, [knowledgePointId+tagId]",
  conversationKnowledgePoints:
    "id, conversationId, knowledgePointId, [conversationId+knowledgePointId]",
  settings: "id",
  conversations: "id, createdAt, updatedAt",
  messages: "id, conversationId, createdAt",
  files: "id, source, createdAt, hash, *albumIds",
  albums: "id, title, createdAt, updatedAt",
});

export { db };
