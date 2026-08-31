import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConnectedProblemView } from "./_problem-view";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "~/components/ui/carousel";
import { useRxEvent } from "~/event/events";

/**
 * 批量题目的共用展示：多题进轮播、单题直接铺，逐题可作答/判题/看解析。
 * 批量创建(createProblemsByAttachment)与批量练习(practiceProblems)共用。
 */
export const ProblemBatchView = ({
  ids,
  chatId,
}: {
  ids: string[];
  chatId?: string;
}) => {
  const { t } = useTranslation();

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
      setCount(api.scrollSnapList().length);
    };
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const blockRef = useRef<HTMLDivElement>(null);

  // 右侧题目列表点某道题时：把轮播切到包含该题的那一页。
  // 直接订阅 scroll-to-problem（BehaviorSubject 重放，晚挂载也能收到），无需滚动方再转发。
  useRxEvent("scroll-to-problem", true, ({ pid }) => {
    const idx = ids.indexOf(pid);
    if (idx < 0) return;
    // jump=true:不做长距离平滑滑动(会跨过一整排重的题目卡片导致卡顿),直接瞬移到该题
    api?.scrollTo(idx, true);
  });

  if (ids.length === 0) return null;

  return (
    <div ref={blockRef} className="w-full">
      <div className="mb-2 text-xs text-muted-foreground">
        {t("toolCall.createdProblems", { count: ids.length })}
      </div>
      {ids.length === 1 ? (
        <ConnectedProblemView problemId={ids[0]!} chatId={chatId} />
      ) : (
        <>
          <Carousel setApi={setApi} className="w-10/12 mx-auto">
            <CarouselContent>
              {ids.map((id) => (
                <CarouselItem key={id} className="my-auto">
                  <ConnectedProblemView problemId={id} chatId={chatId} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            {count > 0 ? `${current + 1} / ${count}` : ""}
          </div>
        </>
      )}
    </div>
  );
};
