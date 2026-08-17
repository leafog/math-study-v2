import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize LaTeX math delimiters to `$$...$$` (the only format remark-math
 * recognizes here, since `singleDollarTextMath` is off).
 *
 * Converts `\[` `\]` `\(` `\)` and lone single `$` to `$$`, leaving existing
 * `$$` untouched. Function replacers are used so `$$` in the replacement is
 * taken literally (string replacements would interpret it as an escaped `$`).
 */
export function normalizeMathDelimiters(text: string | undefined): string {
  if (text === undefined) return "";
  return text
    .replaceAll(String.raw`\[`, () => "$$")
    .replaceAll(String.raw`\]`, () => "$$")
    .replaceAll(String.raw`\(`, () => "$$")
    .replaceAll(String.raw`\)`, () => "$$")
    .replace(/(?<!\$)\$(?!\$)/g, () => "$$");
}
