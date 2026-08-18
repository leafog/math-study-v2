import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactVirtualizer } from "@tanstack/react-virtual";
import { bus, type ScrollToProblemCommand } from "~/event/event-bus";
import { useEvent } from "~/event/use-event";
import type { UIChatMessage } from "~/lib/agent/types";

/**
 * pid → 消息索引 映射:扫描消息中 tool-createProblem 的输出 id。
 * 旧数据 rel 没有 message_id,这里始终以当前消息列表为准(与视图一致)。
 */
const buildProblemToIndex = (
  messages: UIChatMessage[],
): Map<string, number> => {
  const map = new Map<string, number>();

  messages.forEach((msg, index) => {
    for (const part of msg.parts ?? []) {
      if (
        part.type === "tool-createProblem" ||
        part.type === "tool-practiceProblem"
      ) {
        const pid = part.output?.id;
        if (pid) map.set(pid, index);
      }
    }
  });
  return map;
};

export const useChatProblemScroll = ({
  virtualizer,
  scrollRef,
  messages,
}: {
  virtualizer: ReactVirtualizer<HTMLDivElement, Element>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: UIChatMessage[];
}) => {
  const problemToIndex = useMemo(
    () => buildProblemToIndex(messages),
    [messages],
  );

  // 尚未能解析 pid 时的待执行命令(初始定位等)
  const pendingRef = useRef<ScrollToProblemCommand | null>(null);
  const pendingAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);
  const microTimerRef = useRef<number | null>(null);
  const scrollEndOffRef = useRef<(() => void) | null>(null);

  const clearSettle = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    if (microTimerRef.current !== null) {
      window.clearTimeout(microTimerRef.current);
      microTimerRef.current = null;
    }
    scrollEndOffRef.current?.();
    scrollEndOffRef.current = null;
  }, []);

  const finalize = useCallback(
    (pid: string, toolCallId?: string) => {
      // 行挂载可能在滚动结束的同一帧才提交,推迟到下一帧确保 ProblemPreview
      // 的 ref 已注册,高亮/展开事件才不会落空
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        bus.emit("problem:scroll-to", pid);
      });
    },
    [scrollRef],
  );

  const runScroll = useCallback(
    (cmd: ScrollToProblemCommand) => {
      const { pid, behavior = "smooth", toolCallId } = cmd;
      const index = problemToIndex.get(pid);
      const el = scrollRef.current;
      if (index === undefined || index < 0 || !el) {
        // 解析不到(消息被删除/重新生成):仅高亮,不滚动
        finalize(pid, toolCallId);
        return;
      }
      // 目标行已挂载且在容器中央 60% 内 → 不滚动,直接高亮/展开
      const rowEl = el.querySelector(`[data-index="${index}"]`);

      const toolEl = el.querySelector(`[data-tool-call-id="${toolCallId}"]`);
      if (toolEl) {
        const c = el.getBoundingClientRect();
        const r = toolEl.getBoundingClientRect();
        const inCentral =
          r.top >= c.top + c.height * 0.2 &&
          r.bottom <= c.bottom - c.height * 0.2;
        if (inCentral) {
          finalize(pid, toolCallId);
          return;
        }
      }
      clearSettle();

      const intraOffset =
        toolEl && rowEl
          ? toolEl.getBoundingClientRect().top -
            rowEl.getBoundingClientRect().top
          : 0;
      const [offset] = virtualizer.getOffsetForIndex(index, "start") ?? [
        undefined,
        undefined,
      ];

      if (offset) {
        virtualizer.scrollToOffset(offset + intraOffset, {
          align: "start",
          behavior,
        });
      }

      if (el && "onscrollend" in el) {
        const handler = () => {
          scrollEndOffRef.current = null;
          finalize(pid, toolCallId);
        };
        scrollEndOffRef.current = () =>
          el.removeEventListener("scrollend", handler);
        el.addEventListener("scrollend", handler, { once: true });
      }
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null;
        finalize(pid, toolCallId);
      }, 1000);
    },
    [problemToIndex, scrollRef, virtualizer, finalize, clearSettle],
  );

  useEvent("chat:scroll-to-problem", (cmd) => {
    if (!problemToIndex.has(cmd.pid)) {
      // 消息未就绪(如初始 ?problemId= 定位):缓存,消息到达后自动执行
      pendingRef.current = cmd;
      pendingAtRef.current = Date.now();
      return;
    }
    pendingRef.current = null;
    runScroll(cmd);
  });

  // 消息就绪后执行缓存的命令;8s 内始终解析不到则丢弃
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (problemToIndex.has(pending.pid)) {
      pendingRef.current = null;
      runScroll(pending);
    } else if (Date.now() - pendingAtRef.current > 8000) {
      pendingRef.current = null;
    }
  }, [problemToIndex, runScroll]);

  // 卸载 / 切换会话时清理所有挂起的滚动与定时器
  useEffect(() => {
    return () => {
      clearSettle();
      pendingRef.current = null;
    };
  }, [clearSettle]);
};
