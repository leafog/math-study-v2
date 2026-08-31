import { useEffect, useRef } from "react";
import { rxjs } from "./rx-event";
import type { ToolKind } from "../components/chat/tools";

// ==================== 事件声明 ====================

/** 聚焦某条标注 */
export type FocusAnnotationEvent = {
  toolId: string;
  annoIdx: number;
};

/** 滚动到某道题 */
export type ScrollToProblemCommand = {
  pid: string;
  toolCallId: string;
  /** 平滑(用户点击)或立即(初始定位) */
  behavior?: ScrollBehavior;
};

/** 事件声明：事件名 → payload 类型（原 mitt 的 AppEvents 全部并入） */
export type AppEvents = {
  // 标注聚焦 / 题目滚动：消费端可能晚挂载，必须重放
  "focus-annotation": FocusAnnotationEvent;
  "scroll-to-problem": ScrollToProblemCommand;
  // 其余为原 mitt 事件，默认不重放（保持 mitt 的广播语义）
  "topic:in-chat-view-topic": string;
  "push-prompt-input": string;
  "open:tool:by-ref-id": {
    kind: ToolKind;
    title?: string;
    refId: string;
  };
  "open:tool:by-tool-id": {
    toolId: string;
  };
  "active:tool": {
    toolId: string;
  };
  "chat:create:by-open-tool": void;
};

/** 需要"先发布、后挂载"仍能消费的事件：用 BehaviorSubject（重放）。其余用普通 Subject。 */
const REPLAY_EVENTS: ReadonlySet<keyof AppEvents> = new Set([
  "focus-annotation",
  "scroll-to-problem",
]);

/** 默认实例：与 mitt 的 bus 同款用法 */
export const bus = rxjs<AppEvents>(REPLAY_EVENTS);

/** React 订阅钩子：enabled 为 true 才订阅；Behavior 缓存的值会在 enabled 变 true 时重放 */
export function useRxEvent<K extends keyof AppEvents>(
  name: K,
  enabled: boolean,
  handler: (payload: AppEvents[K]) => void,
): void;
export function useRxEvent<K extends keyof AppEvents>(
  names: readonly K[],
  enabled: boolean,
  handler: (payload: AppEvents[K], name: K) => void,
): void;
export function useRxEvent<K extends keyof AppEvents>(
  nameOrNames: K | readonly K[],
  enabled: boolean,
  handler: (payload: AppEvents[K], name?: K) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const names = Array.isArray(nameOrNames) ? nameOrNames : [nameOrNames];
  const key = names.join("|");
  useEffect(() => {
    if (!enabled) return;
    const unsubs = names.map((n) =>
      bus.on(n, (p: AppEvents[K]) =>
        Array.isArray(nameOrNames)
          ? handlerRef.current(p, n)
          : handlerRef.current(p),
      ),
    );
    return () => unsubs.forEach((un) => un());
  }, [enabled, key]);
}
