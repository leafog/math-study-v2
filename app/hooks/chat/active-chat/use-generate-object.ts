import { useCallback, useRef, useState } from "react";

import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";
import { useChatModel } from "./hooks";

/** useGenerateObject 的返回值。 */
export interface GenerateObjectResult<TOut> {
  generate: (prompt: string) => Promise<TOut | null>;
  loading: boolean;
  error: string | null;
  /** 是否有可用模型;false 时应禁用生成入口。 */
  ready: boolean;
}

/**
 * 用当前会话激活的模型做一次独立的「结构化对象生成」(不经过聊天传输)。
 *
 * 两种调用:
 * 1. 只传 schema —— 内部自动 useChatModel(),适合普通子组件:
 *    `useGenerateObject(questionSchema)`
 * 2. 再传 model —— 显式指定模型,适合 Provider 等已持有 model 的地方:
 *    `useGenerateObject(questionSchema, model)`
 *
 * 用法:
 * ```tsx
 * const question = z.object({ stem: z.string(), answer: z.number() });
 * const { generate, loading, error, ready } = useGenerateObject(question);
 *
 * // 在用户动作里
 * const obj = await generate("从这段话里抽一道题");
 * if (obj) { /* 使用 obj  *\/ }
 * ```
 *
 * - `ready` 为 false 表示未选模型,子组件应禁用生成入口。
 * - schema 用 ref 持有,`generate` 函数引用稳定,不会随渲染重建。
 * - 底层用 `generateText` + `Output.object()` 结构化输出实现
 *   (`generateObject` 在 ai v7 已废弃)。
 */
export function useGenerateObject<TOut>(
  schema: z.ZodType<TOut>,
): GenerateObjectResult<TOut>;

export function useGenerateObject<TOut>(
  schema: z.ZodType<TOut>,
  model: LanguageModel | null,
): GenerateObjectResult<TOut>;

export function useGenerateObject<TOut>(
  schema: z.ZodType<TOut>,
  model?: LanguageModel | null,
): GenerateObjectResult<TOut> {
  // 总是读取 context(满足 hooks 规则);显式传了 model 时优先用显式的。
  const contextModel = useChatModel();
  const resolvedModel = model ?? contextModel;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const generate = useCallback(
    async (prompt: string): Promise<TOut | null> => {
      if (!resolvedModel) return null;
      setLoading(true);
      setError(null);
      try {
        const { output: obj } = await generateText({
          model: resolvedModel,
          output: Output.object({ schema: schemaRef.current }),
          prompt,
        });
        return obj;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [resolvedModel],
  );

  return { generate, loading, error, ready: resolvedModel !== null };
}
