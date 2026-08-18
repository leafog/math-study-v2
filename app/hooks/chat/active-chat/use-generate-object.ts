import { useCallback, useRef, useState } from "react";

import { generateText, Output } from "ai";
import type { z } from "zod";
import { useChatModel } from "./hooks";

/**
 * 用当前会话激活的模型做一次独立的「结构化对象生成」(不经过聊天传输)。
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
 * - 底层用 `generateText` + `output.object()` 结构化输出实现
 *   (`generateObject` 在 ai v7 已废弃)。
 */
export function useGenerateObject<TOut>(schema: z.ZodType<TOut>) {
  const model = useChatModel();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  const generate = useCallback(
    async (prompt: string): Promise<TOut | null> => {
      if (!model) return null;
      setLoading(true);
      setError(null);
      try {
        const { output: obj } = await generateText({
          model,
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
    [model],
  );

  return { generate, loading, error, ready: model !== null };
}
