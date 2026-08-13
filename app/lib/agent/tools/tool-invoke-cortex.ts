import { tool } from "ai";
import z from "zod";
import { executeEpsil } from "@cortex-js/compute-engine/epsil";
import { ComputeEngine } from "@cortex-js/compute-engine";
import { chatIdStore } from "~/store/chat-id-store";
import { getOrPut } from "~/lib/map-utils";

// 每个 chat 缓存一个引擎实例，复用符号表/声明，避免每次调用重复构造
const ceCache = new Map<string, ComputeEngine>();

// 资源上限：防止恶意/幻觉的 source 把主线程卡死
const PRECISION = 20; // 数值精度（有效数字）
const TIME_LIMIT_MS = 1000; // 单次执行超时
const ITERATION_LIMIT = 100_000; // 循环迭代上限
const RECURSION_LIMIT = 1_000; // 递归深度上限
const MAX_COLLECTION_SIZE = 10_000; // 集合物化上限

const createEngine = () => {
  const engine = new ComputeEngine({
    precision: PRECISION,
  });
  engine.iterationLimit = ITERATION_LIMIT;
  engine.recursionLimit = RECURSION_LIMIT;
  engine.maxCollectionSize = MAX_COLLECTION_SIZE;
  return engine;
};

const SOURCE_DESCRIPTION = `A program written in the Epsil symbolic math language. It is symbolic and exact by default: 1/3 stays the rational one-third, Sqrt(2) stays symbolic. Use N(expr) to request a decimal. A program is a sequence of statements (newline- or ;-separated); its value is the LAST statement — there is no print/return. Runtime problems become Error(...) values (not thrown exceptions); malformed source produces diagnostics.

Syntax essentials:
- let x = 5 / const c = 1 — mutable / immutable declaration.
- x = x + 3 — assignment. The bare = is assignment only; equality is ==.
- f(x) = x^2 — function definition; x |-> x^2 — anonymous function; function f(x) { ... } — block form.
- if cond { a } else { b } — if is an expression, usable in any expression position.
- Comments: // line and /* block */. NOT # (that starts a pragma).
- Collections: list [1,2,3], set {1,2,3}, tuple (1,2), dictionary {one -> 1}; access d["key"]; matrix m[2,1].

Critical gotchas (do NOT follow Python/JS reflexes):
- Indexing is 1-BASED: xs[1] is the first element, xs[-1] the last; xs[0] yields NaN.
- = is assignment, == is equality. Write Solve(x^2 == 4, x), never Solve(x^2 = 4, x).
- 7 / 2 is the exact rational 7/2, not 3.5. Use N(7/2) for 3.5, Floor(7/2) for 3.
- // starts a comment (not floor division). No def / lambda / => / ?: / elif / print.
- Everything is global (no namespaces): Floor, Ceil, Mean, Sin, Length (not len), etc.
- Strings are not collections; use Characters(s). Join strings with StringJoin or interpolation.
- x^1/2 parses as (x^1)/2; write Sqrt(x) or x^(1/2).
- for loops are for effect only; build values with Map/Filter/Reduce.

Useful library: Solve, Simplify, Expand, Factor, N, D (derivative), Integrate, Sum, Product, Floor, Ceil, Round, Sqrt, Abs, Max, Min, Mod, GCD, LCM, Length, First, Last, Rest, Sort, Reverse, Join, Append, Map, Filter, Count, Reduce, Range(a,b) inclusive, Characters, StringJoin, String.

Examples:
- Solve(x^2 + x - 6 == 0, x)   -> [2, -3]
- D(x^3 + x, x)                -> 3x^2 + 1
- Integrate(Sin(x), (x, 0, Pi)) -> 2
- fact(n) = if n <= 1 { 1 } else { n * fact(n - 1) }
- N(Pi, 20)                    -> 3.1415926535897932385

Produce the wanted value as the final statement.`;

export const invokeCortex = tool({
  description:
    "Evaluate a mathematical program in the Epsil symbolic computation language and return its result. Use for exact arithmetic, algebra (Simplify/Factor/Expand), solving equations (Solve), calculus (D/Integrate), and multi-step computations with variables and functions. The program's value is its last statement.",
  inputSchema: z.object({
    source: z.string().describe(SOURCE_DESCRIPTION),
    description: z
      .string()
      .describe(
        "A concise explanation (in the user's language) of what this program computes and what its result means. It is shown to the user next to the computed value so they understand what the number/expression represents.",
      ),
  }),
  execute: ({ source, description }) => {
    const chatId = chatIdStore.getState().chatId;
    const ce = getOrPut(ceCache, chatId, createEngine);
    try {
      // withTimeLimit 要求回调是同步的；executeEpsil 恰好是同步执行
      const result = ce.withTimeLimit(
        { ms: TIME_LIMIT_MS, label: "cortex-tool" },
        () => executeEpsil(ce, source),
      );
      return {
        description,
        result: result.value.toString(),
        latex: result.value.latex,
        diagnostics: result.diagnostics,
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
});
