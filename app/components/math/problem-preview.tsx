import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { MessageContent } from "../ai-elements/message";
import MathResBlock from "./math-res-block";
import MathResInline from "./math-res-inline";
import "katex/dist/katex.min.css";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "~/lib/utils";
import { Badge } from "../ui/badge";
import type { AnswerRecord } from "~/db/db-zod-schema";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Button } from "../ui/button";
import {
  BadgeQuestionMark,
  ChevronDownIcon,
  Clock,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import { Separator } from "../ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { ButtonGroup } from "../ui/button-group";

import { usePinnedProblems } from "~/store/pinned-problems-store";
import { useBoolean, useIntersectionObserver } from "usehooks-ts";
import type { ProblemFull, ProblemStateColor } from "./type";
import { PROBLEM_STATE_COLORS } from "./constants";
import { keyBy } from "lodash-es";
import { motion, useAnimationControls } from "motion/react";
import KgTopicInChatItem from "../graph/kg-topic-in-chat-item";
import CopyButton from "../common-ui/copy-button";
import StatusIcon from "./status-icon";
import MathResInLine from "./math-res-inline";
import { useRxEvent } from "~/event/events";

export type ProblemPreviewHandle = {
  openExplanation: () => void;
  openAnswerRecord: () => void;
  highlight: () => void;
};

export type ProblemProps = {
  className?: string;
} & ProblemFull;

export const toStateColor = (answers: AnswerRecord[]): ProblemStateColor => {
  if (answers.length === 0) {
    return PROBLEM_STATE_COLORS.unanswered;
  }
  return answers.some((it) => it.correct)
    ? PROBLEM_STATE_COLORS.correct
    : PROBLEM_STATE_COLORS.incorrect;
};
const ProblemPreview = forwardRef<ProblemPreviewHandle, ProblemProps>(
  (
    {
      problem,
      answers,
      answerAnalyses,
      kgTopics,
      problemExplanations,
      className,
      chatId,
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const { id, content, description } = problem;
    const [cardRef, isIntersecting] = useIntersectionObserver({
      threshold: 0,
      root: null,
      rootMargin: "-20% 0px -20% 0px",
    });
    const barColor = toStateColor(answers ?? []);

    const answerAnalysesMap = useMemo(
      () => keyBy(answerAnalyses, (it) => it.answer_id),
      [answerAnalyses],
    );

    const isPinned = usePinnedProblems((s) =>
      chatId && id ? s.isPinned(chatId, id) : false,
    );
    const togglePin = usePinnedProblems((s) => s.toggle);

    const {
      value: explanationOpen,
      setTrue: openExplanation,
      toggle: toggleExplanation,
    } = useBoolean(false);
    const {
      value: answerRecordOpen,
      setTrue: openAnswerRecord,
      toggle: toggleAnswerRecord,
    } = useBoolean(false);

    const controls = useAnimationControls();
    const anwsers = useAnimationControls();
    const expplations = useAnimationControls();

    const flash = (c: typeof controls) => {
      c.start({
        backgroundColor: [
          "rgba(59,130,246,0)",
          "rgba(59,130,246,0.1)",
          "rgba(59,130,246,0)",
        ],
        transition: { duration: 0.6 },
      });
    };

    const pendingActionRef = useRef<(() => void) | null>(null);

    // 卡片进入视口时，执行排队中的动作
    useEffect(() => {
      if (isIntersecting && pendingActionRef.current) {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;
        action();
      }
    }, [isIntersecting]);

    // 已在视口内就直接执行，否则排队等滚动到位
    const runWhenVisible = (action: () => void) => {
      if (isIntersecting) {
        action();
      } else {
        pendingActionRef.current = action;
      }
    };

    /** 卡片高亮（左侧色条脉冲） */
    const doHighlight = () => {
      runWhenVisible(() => {
        controls.start({
          scaleX: [1, 4, 1],
          opacity: [1, 0.5, 1],
          transition: { duration: 0.8 },
        });
      });
    };

    useImperativeHandle(ref, () => ({
      openExplanation: () => {
        runWhenVisible(() => {
          openExplanation();
          flash(expplations);
        });
      },
      openAnswerRecord: () => {
        runWhenVisible(() => {
          openAnswerRecord();
          flash(anwsers);
        });
      },
      highlight: doHighlight,
    }));

    // 只在挂载时订阅一次 scroll-to-problem：pid 匹配则自高亮。
    // BehaviorSubject 重放只在首次订阅时来一次（接住"先滚后挂"）；不再随进出视口反复订阅，
    // 避免把缓存的旧事件反复重放导致重复高亮。可见性交给 runWhenVisible 兜底。
    useRxEvent("scroll-to-problem", true, ({ pid }) => {
      if (pid === id) doHighlight();
    });

    return (
      <Card
        ref={cardRef}
        className={cn("my-3 min-w-0 relative m-1 rounded-lg", className)}
      >
        <motion.div
          animate={controls}
          style={{ originX: 0 }}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
            barColor,
          )}
        />
        <CardHeader className="pb-1 pl-5">
          <CardTitle className="flex min-w-0 items-center gap-1.5">
            <StatusIcon status={problem.status} />
            <MathResInLine>{problem.description}</MathResInLine>
          </CardTitle>
          <CardAction>
            <ButtonGroup>
              <CopyButton text={problem.content} />
              {chatId && id && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => togglePin(chatId, id!)}
                    >
                      {isPinned ? (
                        <PinOffIcon className="size-4 text-primary" />
                      ) : (
                        <PinIcon className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isPinned ? t("problem.unpin") : t("problem.pin")}
                  </TooltipContent>
                </Tooltip>
              )}
            </ButtonGroup>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-2 pl-5 min-w-0">
          <div className="text-base min-w-0">
            <MathResBlock>{content}</MathResBlock>
          </div>
        </CardContent>

        {kgTopics.length > 0 && (
          <CardFooter className="flex flex-wrap gap-1 py-2 pl-5 items-center h-full">
            {kgTopics.map((topic) => (
              <KgTopicInChatItem key={topic.id} id={topic.id} />
            ))}
          </CardFooter>
        )}
      </Card>
    );
  },
);

ProblemPreview.displayName = "ProblemPreview";
export default ProblemPreview;
