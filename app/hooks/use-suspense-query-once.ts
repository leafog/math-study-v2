import { useEffect, useRef, useState } from "react";
import {
  createLiveQueryCollection,
  type InitialQueryBuilder,
  type QueryBuilder,
  type InferResultType,
  type ExtractContext,
} from "@tanstack/db";

/**
 * 一次性查询 hook，配合 React Suspense 使用。
 * 组件会在查询完成前 suspend，查询完成后返回结果，**不会监听后续变化**。
 *
 * 实现原理（同 useLiveSuspenseQuery）：
 * 1. render 阶段同步创建 collection + 启动 preload
 * 2. preload 未完成时抛 Promise 触发 Suspense
 * 3. preload 完成后提取数据，清理 collection
 *
 * @example
 * ```tsx
 * const messages = useSuspenseQueryOnce(
 *   (q) =>
 *     q
 *       .from({ messagesColl })
 *       .where(({ messagesColl }) => eq(messagesColl.conversationId, chatId))
 *       .orderBy(({ messagesColl }) => messagesColl.createdAt, {
 *         direction: "asc",
 *       }),
 *   [chatId],
 * );
 * ```
 */
export function useSuspenseQueryOnce<
  TQueryFn extends (q: InitialQueryBuilder) => QueryBuilder<any>,
>(
  queryFn: TQueryFn,
  deps: Parameters<typeof useEffect>[1],
): InferResultType<ExtractContext<ReturnType<TQueryFn>>> {
  type Result = InferResultType<ExtractContext<ReturnType<TQueryFn>>>;

  const resultRef = useRef<Result | null>(null);
  const collectionRef = useRef<ReturnType<
    typeof createLiveQueryCollection
  > | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 首次或 deps 变化时，同步创建 collection 并启动 preload
  if (!collectionRef.current) {
    const collection = createLiveQueryCollection({
      query: (q: InitialQueryBuilder) => (queryFn as any)(q),
      gcTime: 1,
    });
    collectionRef.current = collection;

    const promise = collection.preload();
    promise
      .then(() => {
        const data = collection.toArray as unknown as Result;
        resultRef.current = data;
        setLoaded(true);
      })
      .catch((err) => setError(err))
      .finally(() => {
        collection.cleanup().catch(() => {});
        collectionRef.current = null;
      });

    // 抛 Promise 触发 Suspense
    throw promise;
  }

  // 如果已经加载完成，返回数据
  if (loaded && resultRef.current) {
    return resultRef.current;
  }

  // 出错了
  if (error) {
    throw error;
  }

  // 不应该走到这里，但如果走了就抛出一个异常
  throw new Error("Unexpected state in useSuspenseQueryOnce");
}
