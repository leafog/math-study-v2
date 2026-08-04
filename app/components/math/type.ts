import type {
  AnswerAnalysis,
  AnswerRecord,
  KgTopic,
  Problem,
  ProblemExplanation,
} from "~/db/db-zod-schema";

export interface ProblemFull {
  problem: Problem;
  answers: AnswerRecord[];
  answerAnalyses: AnswerAnalysis[];
  kgTopics: KgTopic[];
  problemExplanations?: ProblemExplanation[];
  chatId?: string;
}
export type ProblemStateColor =
  "bg-muted-foreground" | "bg-primary" | "bg-destructive";
