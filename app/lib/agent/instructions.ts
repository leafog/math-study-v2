import type { PromptKey, PromptOptions } from "./types";
import { registry } from "./sources";

export function getPrompt(key: PromptKey, options?: PromptOptions): string {
  const entry = registry[key];
  if (!entry) throw new Error(`Prompt key "${key}" not found`);

  let text = entry.template;

  if (options?.vars) {
    for (const [k, v] of Object.entries(options.vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

/**
 * Get the raw template string for a prompt key.
 * Useful when caller needs to do custom interpolation.
 */
export function getPromptTemplate(key: PromptKey): string {
  const entry = registry[key];
  if (!entry) throw new Error(`Prompt key "${key}" not found`);
  return entry.template;
}

/**
 * List all available prompt keys.
 */
export function listPrompts(): { key: string; description: string }[] {
  return Object.entries(registry).map(([key, entry]) => ({
    key,
    description: entry.description ?? "",
  }));
}

/**
 * Register or override a prompt at runtime.
 */
export function definePrompt(
  key: string,
  template: string,
  options?: { description?: string },
): void {
  registry[key] = {
    template,
    description: options?.description,
  };
}

// ── Backward-compatible export ──
// Legacy code imports `instructions` directly — resolve via getPrompt("system")
// with a default English reply language.
export const instructions = getPrompt("system", {
  vars: { language: "en" },
});
