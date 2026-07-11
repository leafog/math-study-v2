import { column, PowerSyncDatabase, Schema, Table } from "@powersync/web";

// ── PowerSync schema ───────────────────────────────────────────

export const APP_SCHEMA = new Schema({
  problems: new Table({
    id: column.text,
    content: column.text,
    latex: column.text,
    tags: column.text, // JSON array
    difficulty: column.integer,
    source: column.text,
    imageBlob: column.text,
    contentHash: column.text,
    variantOf: column.text,
    variantType: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  sessions: new Table({
    id: column.text,
    problemId: column.text,
    mode: column.text,
    status: column.text,
    startedAt: column.text,
    completedAt: column.text,
  }),
  records: new Table({
    id: column.text,
    problemId: column.text,
    sessionId: column.text,
    userAnswer: column.text,
    correct: column.integer,
    knowledgePoints: column.text, // JSON array
    timeSpentMs: column.real,
    createdAt: column.text,
  }),
  notes: new Table({
    id: column.text,
    problemId: column.text,
    content: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  knowledge: new Table({
    id: column.text,
    name: column.text,
    description: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  knowledgeEdges: new Table({
    id: column.text,
    source: column.text,
    target: column.text,
    type: column.text,
    createdAt: column.text,
  }),
  knowledgeInteractions: new Table({
    id: column.text,
    knowledgePointId: column.text,
    problemId: column.text,
    type: column.text,
    source: column.text,
    metadata: column.text, // JSON object
    createdAt: column.text,
  }),
  masteryScores: new Table({
    id: column.text,
    score: column.integer,
    totalAttempts: column.integer,
    correctCount: column.integer,
    hintCount: column.integer,
    lastPracticedAt: column.text,
    nextReviewAt: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  practiceLogs: new Table({
    id: column.text,
    knowledgePointId: column.text,
    problemId: column.text,
    understood: column.integer,
    errorType: column.text,
    hintDependent: column.integer,
    misconception: column.text,
    nextAction: column.text,
    createdAt: column.text,
  }),
  tags: new Table({
    id: column.text,
    name: column.text,
    color: column.text,
    description: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  knowledgeTags: new Table({
    id: column.text,
    knowledgePointId: column.text,
    tagId: column.text,
    createdAt: column.text,
  }),
  conversations: new Table({
    id: column.text,
    title: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
  messages: new Table({
    id: column.text,
    conversationId: column.text,
    role: column.text,
    content: column.text,
    problemIds: column.text, // JSON array
    fileIds: column.text, // JSON array
    partsJson: column.text,
    createdAt: column.text,
  }),
  files: new Table({
    id: column.text,
    name: column.text,
    mediaType: column.text,
    size: column.real,
    blob: column.text,
    thumbnail: column.text,
    width: column.real,
    height: column.real,
    hash: column.text,
    source: column.text,
    problemIds: column.text, // JSON array
    albumIds: column.text, // JSON array
    createdAt: column.text,
  }),
  albums: new Table({
    id: column.text,
    title: column.text,
    description: column.text,
    coverFileId: column.text,
    createdAt: column.text,
    updatedAt: column.text,
  }),
});

// ── Database instance ─────────────────────────────────────────

export const db = new PowerSyncDatabase({
  database: {
    dbFilename: "math-study-v2.sqlite",
  },
  schema: APP_SCHEMA,
});
