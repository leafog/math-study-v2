import { create } from "zustand";
import { combine } from "zustand/middleware";

import { createSelectors } from "./create-selectors";

export type Suggestion = {
  icon: string;
  prev: string;
  showKey: string;
  promptKey: string;
};

type ChatPromptSuggestionState = {
  suggestions: Suggestion[];
  hasSuggestions: boolean;
};

type ChatPromptSuggestionAction = {
  setSuggestions: (suggestions: Suggestion[]) => void;
};

const chatPromptSuggestionStore = create(
  combine<ChatPromptSuggestionState, ChatPromptSuggestionAction>(
    { suggestions: [], hasSuggestions: false },
    (set) => ({
      setSuggestions: (suggestions) =>
        set({ suggestions, hasSuggestions: suggestions.length > 0 }),
    }),
  ),
);

export const useChatPromptSuggestionStore = createSelectors(
  chatPromptSuggestionStore,
);
