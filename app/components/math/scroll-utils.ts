const EXPLANATION_OPEN_EVENT = "problem:open-explanation";
const ANSWER_RECORD_OPEN_EVENT = "problem:open-answer-record";
const PROBLEM_SCROLL_EVENT = "problem:scroll-to";

/**
 *  setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent(PROBLEM_SCROLL_EVENT, { detail: problemId }),
      );
    }, 400);
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
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
export function scrollToProblem(problemId: string): void {
  scrollToProblemWithOutEvent(problemId);
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(PROBLEM_SCROLL_EVENT, { detail: problemId }),
    );
  }, 400);
}
/**
 * Scroll to a problem and request that its explanation panel be opened.
 */
export function scrollToProblemAndOpenExplanation(problemId: string): void {
  scrollToProblemWithOutEvent(problemId);
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(EXPLANATION_OPEN_EVENT, { detail: problemId }),
    );
  }, 400);
}

/**
 * Scroll to a problem and request that its answer records panel be opened.
 */
export function scrollToProblemAndOpenAnswerRecords(problemId: string): void {
  scrollToProblemWithOutEvent(problemId);
  setTimeout(() => {
    window.dispatchEvent(
      new CustomEvent(ANSWER_RECORD_OPEN_EVENT, { detail: problemId }),
    );
  }, 400);
}

function onEvent(
  eventName: string,
  callback: (problemId: string) => void,
): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent<string>).detail);
  };
  window.addEventListener(eventName, handler);
  return () => window.removeEventListener(eventName, handler);
}

/**
 * Listen for explanation-open requests. Returns an unsubscribe function.
 */
export function onOpenExplanation(
  callback: (problemId: string) => void,
): () => void {
  return onEvent(EXPLANATION_OPEN_EVENT, callback);
}

/**
 * Listen for answer-record-open requests. Returns an unsubscribe function.
 */
export function onOpenAnswerRecords(
  callback: (problemId: string) => void,
): () => void {
  return onEvent(ANSWER_RECORD_OPEN_EVENT, callback);
}

/**
 * Listen for scroll-to-problem events. Returns an unsubscribe function.
 */
export function onScrollToProblem(
  callback: (problemId: string) => void,
): () => void {
  return onEvent(PROBLEM_SCROLL_EVENT, callback);
}
