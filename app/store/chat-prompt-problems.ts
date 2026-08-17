import { create } from "zustand";
import { createSelectors } from "./create-selectors";
import type { Problem } from "~/db/db-zod-schema";

/**
 * In-memory only (no persist middleware): problems attached to the prompt
 * input for the current session. Cleared on chat switch / new chat.
 */
type ChatPromptProblemsState = {
  problems: Problem[];
  hasProblems: boolean;
  pushProblem: (problem: Problem) => void;
  removeProblem: (id: string) => void;
  setProblems: (problems: Problem[]) => void;
  clearProblems: () => void;
};

const chatPromptProblemsStore = create<ChatPromptProblemsState>((set) => ({
  problems: [],
  hasProblems: false,
  pushProblem: (problem) =>
    set((state) => ({
      problems: [...state.problems, problem],
      hasProblems: true,
    })),
  removeProblem: (id) =>
    set((state) => {
      const problems = state.problems.filter((it) => it.id !== id);
      return { problems, hasProblems: problems.length > 0 };
    }),
  setProblems: (problems) => set({ problems, hasProblems: problems.length > 0 }),
  clearProblems: () => set({ problems: [], hasProblems: false }),
}));

export const useChatPromptProblems = createSelectors(chatPromptProblemsStore);
