import { bus } from "~/event/events";

export function scrollToProblem(pid: string, toolCallId: string): void {
  bus.emit("scroll-to-problem", { pid, toolCallId, behavior: "smooth" });
}
