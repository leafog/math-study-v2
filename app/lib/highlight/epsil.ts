import {
  defineLanguage,
  type HighlightTokenClass,
  type LanguageDefinition,
  type TokenRange,
  type TokenizerContext,
} from "@tanstack/highlight/core";

/**
 * Epsil 符号计算语言的 @tanstack/highlight 语法包。
 *
 * 由于 `patternTokenizer` 只在包的 internal/ 子路径(未在 exports 公开),
 * 这里直接用相同逻辑实现 tokenize:按数组顺序跑每个全局正则,用 occupied
 * 区间去重 overlap —— 越靠前的模式优先级越高、越先占位。这样注释/字符串
 * 内部的代码不会被后面的关键词/数字误标。
 *
 * 关键词参考 cortex-compute-engine 的 reserved-words:
 *   HARD_RESERVED = ACTIVE_WORDS(if match do for while function const
 *   protocol else in break continue) ∪ LITERAL_WORDS(true false Infinity NaN)
 *   `let`/`type`/`alias` 为上下文关键词,单独高亮。
 */

type Pattern = { className: HighlightTokenClass; regex: RegExp };

const patterns: Pattern[] = [
  // 注释必须最先,先占位避免内部代码被误标
  { className: "comment", regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\//g },

  // 字符串:双引号、单引号、以及 verbatim `` `word` `` 形式
  {
    className: "string",
    regex: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`/g,
  },

  // 关键字
  {
    className: "keyword",
    regex: /\b(?:if|match|do|for|while|function|const|protocol|else|in|break|continue|let|type|alias)\b/g,
  },

  // 字面量
  { className: "literal", regex: /\b(?:true|false|Infinity|NaN|oo)\b/g },

  // 数字:整数/小数/科学计数/十六进制
  {
    className: "number",
    regex: /\b(?:0x[0-9a-fA-F]+|\d+\.\d+(?:e[+-]?\d+)?|\d+(?:e[+-]?\d+)?)\b/gi,
  },

  // 函数调用:标识符紧跟 (
  { className: "function", regex: /\b([A-Za-z_][A-Za-z0-9_]*)(?=\s*\()/g },

  // 运算符
  {
    className: "operator",
    regex: /->|==|!=|<=|>=|:=|\+=|-=|\*=|\/=|::|\.\.|\?|=>|[-+*/%^=<>!&|~]/g,
  },
];

function tokenizeEpsil(code: string, _context: TokenizerContext): TokenRange[] {
  const ranges: TokenRange[] = [];
  for (const { className, regex } of patterns) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(code)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      // 与已占用的区间重叠则跳过(模式按顺序优先)
      if (!ranges.some((r) => start < r.end && end > r.start)) {
        ranges.push({ className, start, end });
      }
      // 防御空匹配死循环
      if (m[0].length === 0) regex.lastIndex++;
    }
  }
  return ranges;
}

/** @tanstack/highlight 语法包定义 */
export const epsil: LanguageDefinition<"epsil"> = defineLanguage({
  name: "epsil",
  aliases: ["cortex", "compute-engine"],
  tokenize: tokenizeEpsil,
});

/** 供 createHighlighter 注册 */
export const epsilLanguage: LanguageDefinition<"epsil"> = epsil;
