import type { Locale, PromptKey, PromptOptions } from "./types";
import { registry } from "./sources";

const FALLBACK_CHAIN: Locale[] = ["zh", "en"];

export function getPrompt(key: PromptKey, options?: PromptOptions): string {
  const locale = resolveLocale(options?.locale);
  const entry = resolveEntry(key, locale);

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
export function getPromptTemplate(key: PromptKey, locale?: Locale): string {
  const resolved = resolveLocale(locale);
  return resolveEntry(key, resolved).template;
}

/**
 * List all available prompt keys for a given locale.
 */
export function listPrompts(
  locale?: Locale,
): { key: string; description: string }[] {
  const resolved = resolveLocale(locale);
  const source = registry[resolved];
  return Object.entries(source).map(([key, entry]) => ({
    key,
    description: entry.description ?? "",
  }));
}

/**
 * Register or override a prompt at runtime.
 * Merges into the target locale's registry.
 */
export function definePrompt(
  key: string,
  template: string,
  options?: { locale?: Locale; description?: string },
): void {
  const locale = options?.locale ?? resolveLocale();
  if (!registry[locale]) {
    registry[locale] = {};
  }
  registry[locale][key] = {
    template,
    description: options?.description,
  };
}

// ── Backward-compatible export ──
// Legacy code imports `instructions` directly — resolve via getPrompt("system").
export const instructions = getPrompt("system");

// ── Internal helpers ──

function resolveLocale(preferred?: Locale): Locale {
  if (preferred) return preferred;

  // Try to detect from i18next (browser language)
  if (typeof window !== "undefined") {
    try {
      // dynamic import to avoid bundling i18next into non-React code
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const i18n = require("i18next");
      const lang = i18n.language as string | undefined;
      if (lang?.startsWith("zh")) return "zh";
      if (lang?.startsWith("en")) return "en";
    } catch {
      // i18next not available
    }
  }

  return "zh";
}

function resolveEntry(
  key: string,
  locale: Locale,
): { template: string; description?: string } {
  // Try target locale
  const entry = registry[locale]?.[key];
  if (entry) return entry;

  // Fallback chain
  for (const fallback of FALLBACK_CHAIN) {
    if (fallback === locale) continue;
    const fallbackEntry = registry[fallback]?.[key];
    if (fallbackEntry) return fallbackEntry;
  }

  throw new Error(`Prompt key "${key}" not found in any locale`);
}
