/** 与 _tool-common.tsx statusIcons 的色系保持一致 */

/** 答题结果颜色 —— Tailwind 类名常量 */
export const ANSWER_COLORS = {
  /** 正确 — 对应 statusIcons 的 `output-available` (green-600) */
  correct: {
    text: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950",
    border: "border-green-200 dark:border-green-800",
  },
  /** 错误 — 暖色调，对应 statusIcons 的 `output-denied` (orange-600) 但更柔和 */
  incorrect: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950",
    border: "border-amber-200 dark:border-amber-800",
  },
} as const;

/** 题目状态色 —— 与 statusIcons 色系一致 */
export const PROBLEM_STATE_COLORS = {
  /** 未回答 — 对应 input-streaming / 默认 (灰色) */
  unanswered: "bg-gray-400 dark:bg-gray-500",
  /** 已答对 — 对应 output-available (green-600) */
  correct: "bg-green-600 dark:bg-green-500",
  /** 答错 — 对应 output-denied (orange-600)，暖色不刺眼 */
  incorrect: "bg-amber-600 dark:bg-amber-500",
} as const;
