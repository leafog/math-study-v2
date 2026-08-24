import { createHighlighter } from "@tanstack/highlight/core";
import { createThemeCss } from "@tanstack/highlight/theme";
import { githubDarkTheme } from "@tanstack/highlight/themes/github-dark";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";
import { parseEpsil, serializeEpsil } from "@cortex-js/compute-engine/epsil";
import { epsil } from "./epsil";

/** 模块级单例,复用词法状态 */
export const highlighter = createHighlighter({ languages: [epsil] });

/** GitHub 主题(亮/暗),生成 th-* token 的 CSS;.dark 与 next-themes 的 class 策略对齐 */
export const EPSIL_TOKEN_STYLES = createThemeCss({
  dark: githubDarkTheme,
  light: githubLightTheme,
  darkSelector: ".dark",
  codeBlockSelector: ".th-code",
});

/**
 * 格式化 epsil 源码:parse → serialize 重排版。
 * 解析失败(诊断含 error)时回退到原文,避免把半截代码搞坏。
 */
export function formatEpsil(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return source;
  try {
    const [expr, diagnostics] = parseEpsil(trimmed);
    const hasError = diagnostics.some((d) => d.severity === "error");
    if (hasError) return source;
    return serializeEpsil(expr);
  } catch {
    return source;
  }
}

/** 将 epsil 源码格式化后渲染为高亮 HTML */
export function highlightEpsil(source: string): string {
  if (!source.trim()) return "";
  return highlighter.highlightToHtml(formatEpsil(source), { lang: "epsil" });
}
