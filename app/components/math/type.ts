import type {
  AnswerAnalysis,
  AnswerRecord,
  KgTopic,
  Problem,
  ProblemExplanation,
} from "~/db/db-zod-schema";
import { PROBLEM_STATE_COLORS } from "./constants";

export interface ProblemFull {
  problem: Problem;
  answers: AnswerRecord[];
  answerAnalyses: AnswerAnalysis[];
  kgTopics: KgTopic[];
  problemExplanations?: ProblemExplanation[];
  chatId?: string;
}

export type ProblemStateColor =
  (typeof PROBLEM_STATE_COLORS)[keyof typeof PROBLEM_STATE_COLORS];
