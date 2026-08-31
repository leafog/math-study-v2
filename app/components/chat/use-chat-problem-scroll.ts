import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ReactVirtualizer } from "@tanstack/react-virtual";
import { useRxEvent } from "~/event/events";
import type { ScrollToProblemCommand } from "~/event/events";
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
      if (
        part.type === "tool-createProblemsByAttachment" ||
        part.type === "tool-practiceProblems"
      ) {
        const pids = part.output?.ids ?? [];
        pids.forEach((it) => map.set(it, index));
      }
    }
  });
  return map;
};

/**
 * 订阅 scroll-to-problem，把聊天滚动到目标题目所在的消息行。
 * 命令到达但目标消息未就绪（如初始 ?problemId= 定位）时缓存，
 * 等 problemToIndex 就绪后补执行。只负责滚动，不再转发其他事件——
 * 批量题轮播等晚挂载消费方直接订阅 scroll-to-problem（BehaviorSubject 重放）即可。
 */
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

  const runScroll = useCallback(
    (cmd: ScrollToProblemCommand) => {
      const { pid, behavior = "smooth", toolCallId } = cmd;
      const index = problemToIndex.get(pid);
      const el = scrollRef.current;
      if (index === undefined || index < 0 || !el) return;

      // 目标行已挂载且在容器中央 60% 内 → 不滚动
      const rowEl = el.querySelector(`[data-index="${index}"]`);
      const toolEl = el.querySelector(`[data-tool-call-id="${toolCallId}"]`);
      if (toolEl) {
        const c = el.getBoundingClientRect();
        const r = toolEl.getBoundingClientRect();
        const inCentral =
          r.top >= c.top + c.height * 0.2 &&
          r.bottom <= c.bottom - c.height * 0.2;
        if (inCentral) return;
      }
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
    },
    [problemToIndex, scrollRef, virtualizer],
  );

  // 目标消息未就绪时的缓存命令：problemToIndex 就绪后补执行
  const pendingRef = useRef<ScrollToProblemCommand | null>(null);

  useRxEvent("scroll-to-problem", true, (cmd) => {
    if (problemToIndex.has(cmd.pid)) {
      runScroll(cmd);
    } else {
      pendingRef.current = cmd;
    }
  });

  useEffect(() => {
    const pending = pendingRef.current;
    if (pending && problemToIndex.has(pending.pid)) {
      pendingRef.current = null;
      runScroll(pending);
    }
  }, [problemToIndex, runScroll]);

  return {};
};
