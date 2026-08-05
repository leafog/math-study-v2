import type { LucideIcon } from "lucide-react";
import { BookOpenText, Lightbulb, Map, RotateCcwIcon } from "lucide-react";

/** Icon IDs used across chat components */
export type ChatIconId = "understand" | "solve-problem" | "knowledge-map" | "review";

/** Central icon map — use `chatIconMap[id]` to get the Lucide icon component */
export const chatIconMap: Record<ChatIconId, LucideIcon> = {
  understand: BookOpenText,
  "solve-problem": Lightbulb,
  "knowledge-map": Map,
  review: RotateCcwIcon,
};

/** Color classes for each icon */
export const chatIconColors: Record<ChatIconId, string> = {
  understand: "text-blue-500",
  "solve-problem": "text-amber-500",
  "knowledge-map": "text-emerald-500",
  review: "text-violet-500",
};
