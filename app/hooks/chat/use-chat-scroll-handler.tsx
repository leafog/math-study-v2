import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import type { StickToBottomContext } from "use-stick-to-bottom";
import { withRef } from "~/lib/ref-utils";

const useChatScrollHandler = ({
  scrollPaddingTop,
  scrollPaddingBottom,
  showTop,
}: {
  scrollPaddingTop: number | null;
  scrollPaddingBottom: number | null;
  showTop: boolean;
}) => {
  const stickRef = useRef<StickToBottomContext>(null);
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get("problemId");

  useEffect(() => {
    const stick = stickRef.current;
    if (!stick) return;

    const scrollEl = stick.scrollRef?.current;
    if (scrollEl && scrollPaddingBottom) {
      scrollEl.style.scrollPaddingBottom = `${scrollPaddingBottom + 24}px`;
    }

    if (problemId) {
      stickRef.current?.stopScroll();
    }
  }, [problemId, scrollPaddingBottom]);

  useEffect(() => {
    if (scrollPaddingTop) {
      withRef(stickRef, (it) => {
        const scrollEl = it.scrollRef?.current;
        if (scrollEl) {
          scrollEl.style.scrollPaddingTop = showTop
            ? `${scrollPaddingTop + 16}px`
            : "0px";
        }
      });
    }
  }, [scrollPaddingTop, showTop]);

  return { stickRef };
};

export default useChatScrollHandler;
