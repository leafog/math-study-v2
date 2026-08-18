import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { toText } from "hast-util-to-text";
import katex from "katex";
import remarkMath from "remark-math";
import { SKIP, visitParents } from "unist-util-visit-parents";
import type { Pluggable } from "unified";
import type { MathPlugin } from "streamdown";
import { remarkBracketMath } from "./bracket-math-extension";

// 与 @streamdown/math 同构的 math 插件,但 rehype 阶段带公式级缓存:
// katex.renderToString 是纯函数,按 (displayMode + 公式文本) 缓存渲染结果。
// 缓存存活于模块级,跨消息挂载/跨会话切换复用,避免每次切换回长公式消息时
// 重复执行 KaTeX(切换卡顿的主要来源)。
const formulaCache = new Map<string, string>();
const MAX_FORMULA_CACHE = 2000;

function cachedRehypeKatex(options: { errorColor?: string } = {}) {
  return function (tree: any, _file: any) {
    visitParents(tree, "element", function (element: any, parents: any[]) {
      const classes: string[] = Array.isArray(element.properties.className)
        ? element.properties.className
        : [];
      const languageMath = classes.includes("language-math");
      const mathDisplay = classes.includes("math-display");
      const mathInline = classes.includes("math-inline");
      if (!languageMath && !mathDisplay && !mathInline) return;

      let parent = parents.at(-1);
      let scope = element;
      let displayMode = mathDisplay;

      // ```math 围栏代码块:替换 <pre>,按块级渲染
      if (
        element.tagName === "code" &&
        languageMath &&
        parent?.type === "element" &&
        parent.tagName === "pre"
      ) {
        scope = parent;
        parent = parents.at(-2);
        displayMode = true;
      }

      if (!parent) return;

      const value = toText(scope, { whitespace: "pre" });
      const cacheKey = `${displayMode ? "b" : "i"}:${value}`;

      let html = formulaCache.get(cacheKey);
      if (html === undefined) {
        html = katex.renderToString(value, {
          displayMode,
          throwOnError: false,
          errorColor: options.errorColor ?? "#cc0000",
        });
        formulaCache.set(cacheKey, html);
        if (formulaCache.size > MAX_FORMULA_CACHE) {
          const oldest = formulaCache.keys().next().value;
          if (oldest !== undefined) formulaCache.delete(oldest);
        }
      }

      const root = fromHtmlIsomorphic(html, { fragment: true });
      const index = parent.children.indexOf(element);
      parent.children.splice(index, 1, ...root.children);
      return SKIP;
    });
  };
}

export const math: MathPlugin = {
  name: "katex",
  type: "math",
  // 与 @streamdown/math 保持相同的运行时配置(remark-math v6 类型不含
  // singleDollarTextMath,原插件为 JS 未报错,这里按 Pluggable 断言)。
  // 在 remark-math 之外叠加 bracket-math 扩展,额外支持 \( \) / \[ \]。
  // remarkPlugin 本身就是插件列表,unified 会把 `[[remarkMath, opts], remarkBracketMath]`
  // 依次 use;两个插件只在 data.micromarkExtensions 上追加,无顺序耦合。
  remarkPlugin: [
    [remarkMath, { singleDollarTextMath: false }],
    remarkBracketMath,
  ] as Pluggable,
  rehypePlugin: [
    cachedRehypeKatex,
    { errorColor: "var(--color-muted-foreground)" },
  ] as Pluggable,
  getStyles() {
    return "katex/dist/katex.min.css";
  },
};
