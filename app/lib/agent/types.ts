export type Locale = "zh" | "en";

/** Known prompt keys — extend as needed */
export type PromptKey = "system" | (string & {});

export interface PromptOptions {
  locale?: Locale;
  vars?: Record<string, string>;
}

export interface PromptEntry {
  template: string;
  description?: string;
}

export type PromptRegistry = Record<string, PromptEntry>;
