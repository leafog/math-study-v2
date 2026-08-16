import { bus } from "~/event/event-bus";

/**
 * Scroll an element into view after a short delay (for collapsible animations etc.).
 */
export function scrollToSeletion(
  problemId: string,
  selectionId: "answers" | "explanation",
): void {
  const el = document.getElementById(`problem-${problemId}-${selectionId}`);
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  if (rect.top >= viewportHeight * 0.2 && rect.bottom <= viewportHeight * 0.8) {
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Scroll to a problem element by ID.
 * Skips scrolling if the element is already within the central 60% of the viewport.
 */
export function scrollToProblemWithOutEvent(problemId: string): void {
  const el = document.getElementById(`problem-${problemId}`);

  if (!el) return;

  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  if (rect.top >= viewportHeight * 0.2 && rect.bottom <= viewportHeight * 0.8) {
    return;
  }
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

export function scrollToProblem(problemId: string): void {
  scrollToProblemWithOutEvent(problemId);
  bus.emit("problem:scroll-to", problemId);
}

/**
 * Scroll to a problem and request that its explanation panel be opened.
 */
export function scrollToProblemAndOpenExplanation(problemId: string): void {
  scrollToSeletion(problemId, "explanation");
  bus.emit("problem:scroll-to", problemId);
}

/**
 * Scroll to a problem and request that its answer records panel be opened.
 */
export function scrollToProblemAndOpenAnswerRecords(problemId: string): void {
  scrollToSeletion(problemId, "answers");
  bus.emit("problem:open-answer-record", problemId);
}
