import { bus } from "~/event/event-bus";

export function scrollToProblem(pid: string, toolCallId: string): void {
  bus.emit("chat:scroll-to-problem", { pid, toolCallId, behavior: "smooth" });
}
