/**
 * 自定义 micromark 语法扩展:在原生 `$$...$$` / `$...$`(remark-math)之外,
 * 额外支持 LaTeX 风格的分隔符:
 *
 *   - `\( ... \)`  行内公式 → 产出 `mathText` token → `inlineMath` 节点(`math-inline`)
 *   - `\[ ... \]`  块级公式 → 产出 `mathFlow` token → `math` 节点(`math-display`)
 *
 * 只需补 syntax 层:remark-math 已注册 `mdast-util-math` 的 fromMarkdown 处理器,
 * 我们产出同名的 `mathText` / `mathFlow` token,节点构建与 KaTeX 渲染链路零改动复用。
 * 与 `$$` 的原生扩展按字符码(92 vs 36)天然不冲突。
 */

/// <reference types="micromark-extension-math" />
// 上面的 reference 会把 mathText/mathFlow/mathFlowFence... 等 token 名
// 注册进全局 TokenTypeMap,否则 effects.enter("mathText") 等会类型报错。

import { markdownLineEnding } from "micromark-util-character";
import type {
  Code,
  Construct,
  Effects,
  State,
  TokenizeContext,
} from "micromark-util-types";

// 字符码
const BACKSLASH = 92; // \
const LPAREN = 40; // (
const RPAREN = 41; // )
const LBRACKET = 91; // [
const RBRACKET = 93; // ]

/* ------------------------------------------------------------------ *
 * 行内 `\( ... \)`
 * ------------------------------------------------------------------ */

/** 探测 `\)` 的部分构造:匹配则事件保留(分隔符不入 value),不匹配则回退。 */
const closingText: Construct = {
  tokenize: tokenizeClosingText,
  partial: true,
};

function tokenizeClosingText(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== BACKSLASH) return nok(code);
    effects.enter("mathTextSequence");
    effects.consume(code); // \
    return after;
  }

  function after(code: Code): State | undefined {
    if (code !== RPAREN) {
      effects.exit("mathTextSequence");
      return nok(code);
    }
    effects.consume(code); // )
    effects.exit("mathTextSequence");
    return ok(code);
  }
}

function tokenizeBracketText(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== BACKSLASH) return nok(code);
    effects.enter("mathText");
    effects.enter("mathTextSequence");
    effects.consume(code); // \
    return openParen;
  }

  function openParen(code: Code): State | undefined {
    if (code !== LPAREN) {
      effects.exit("mathTextSequence");
      return nok(code);
    }
    effects.consume(code); // (
    effects.exit("mathTextSequence");
    return content;
  }

  function content(code: Code): State | undefined {
    if (code === null) return nok(code); // 未闭合
    if (code === BACKSLASH) {
      // 可能是 \( 或 \\ 或普通 `\frac` 的反斜杠:先用 attempt 探测是否闭合
      return effects.attempt(closingText, afterClose, notClose)(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter("mathTextData");
      effects.consume(code);
      effects.exit("mathTextData");
      return content;
    }
    effects.enter("mathTextData");
    return data(code);
  }

  function data(code: Code): State | undefined {
    if (code === null) return nok(code);
    if (code === BACKSLASH) {
      effects.exit("mathTextData");
      return effects.attempt(closingText, afterClose, notClose)(code);
    }
    if (markdownLineEnding(code)) {
      effects.exit("mathTextData");
      effects.enter("mathTextData");
      effects.consume(code);
      effects.exit("mathTextData");
      return content;
    }
    effects.consume(code);
    return data;
  }

  /** attempt 失败:反斜杠不是闭合,保留为内容。 */
  function notClose(code: Code): State | undefined {
    effects.enter("mathTextData");
    effects.consume(code); // \
    return data;
  }

  function afterClose(code: Code): State | undefined {
    effects.exit("mathText");
    return ok(code);
  }
}

/* ------------------------------------------------------------------ *
 * 块级 `\[ ... \]`
 * ------------------------------------------------------------------ */

/** 探测 `\]` 的部分构造:匹配则事件保留,不匹配则回退。 */
const closingFlow: Construct = {
  tokenize: tokenizeClosingFlow,
  partial: true,
};

function tokenizeClosingFlow(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== BACKSLASH) return nok(code);
    effects.enter("mathFlowFence");
    effects.enter("mathFlowFenceSequence");
    effects.consume(code); // \
    return after;
  }

  function after(code: Code): State | undefined {
    if (code !== RBRACKET) {
      effects.exit("mathFlowFenceSequence");
      effects.exit("mathFlowFence");
      return nok(code);
    }
    effects.consume(code); // ]
    effects.exit("mathFlowFenceSequence");
    effects.exit("mathFlowFence");
    return ok(code);
  }
}

function tokenizeBracketFlow(
  this: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
): State {
  return start;

  function start(code: Code): State | undefined {
    if (code !== BACKSLASH) return nok(code);
    effects.enter("mathFlow");
    effects.enter("mathFlowFence");
    effects.enter("mathFlowFenceSequence");
    effects.consume(code); // \
    return openBracket;
  }

  function openBracket(code: Code): State | undefined {
    if (code !== LBRACKET) {
      effects.exit("mathFlowFenceSequence");
      effects.exit("mathFlowFence");
      return nok(code);
    }
    effects.consume(code); // [
    effects.exit("mathFlowFenceSequence");
    effects.exit("mathFlowFence"); // ← mdast-util-math 在此开始 buffer
    return content;
  }

  function content(code: Code): State | undefined {
    if (code === null) return nok(code); // 未闭合
    if (code === BACKSLASH) {
      return effects.attempt(closingFlow, afterClose, notClose)(code);
    }
    effects.enter("mathFlowValue");
    return value(code);
  }

  function value(code: Code): State | undefined {
    if (code === null) return nok(code);
    if (code === BACKSLASH) {
      effects.exit("mathFlowValue");
      return effects.attempt(closingFlow, afterClose, notClose)(code);
    }
    effects.consume(code);
    return value;
  }

  /** attempt 失败:反斜杠不是闭合,保留为内容。 */
  function notClose(code: Code): State | undefined {
    effects.enter("mathFlowValue");
    effects.consume(code); // \
    return value;
  }

  function afterClose(code: Code): State | undefined {
    effects.exit("mathFlow");
    return ok(code);
  }
}

/* ------------------------------------------------------------------ *
 * 注册
 * ------------------------------------------------------------------ */

const bracketText: Construct = {
  tokenize: tokenizeBracketText,
  name: "mathText",
};

const bracketFlow: Construct = {
  tokenize: tokenizeBracketFlow,
  concrete: true,
  name: "mathFlow",
};

/** 注册到 remark-parse 的 micromark 扩展对象。 */
export const bracketMathExtension = {
  flow: { [BACKSLASH]: bracketFlow },
  text: { [BACKSLASH]: bracketText },
};

/**
 * remark 插件:把 bracketMathExtension 挂到 `micromarkExtensions` 数据上。
 * 需与 remark-math 同 processor 使用(后者提供 mathText/mathFlow 的节点构建)。
 */
export function remarkBracketMath(this: { data: () => unknown }) {
  const data = this.data() as Record<string, unknown[]>;
  const list = data.micromarkExtensions ?? (data.micromarkExtensions = []);
  list.push(bracketMathExtension);
}
