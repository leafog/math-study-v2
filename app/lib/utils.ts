import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize LaTeX math delimiters to `$$...$$` (the only format the renderer supports).
 *
 * Converts `\[` `\]` `\(` `\)` and single `$` to `$$`,
 * then collapses any resulting `$$$$` back to `$$`.
 */
export function normalizeMathDelimiters(text: string): string {
  return text
    .replaceAll(String.raw`\[`, "$$")
    .replaceAll(String.raw`\]`, "$$")
    .replaceAll(String.raw`\(`, "$$")
    .replaceAll(String.raw`\)`, "$$")
    .replaceAll("$", "$$")
    .replaceAll("$$$$", "$$");
}
