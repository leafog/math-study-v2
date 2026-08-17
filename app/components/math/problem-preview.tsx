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
      highlight: () => {
        runWhenVisible(() => {
          controls.start({
            scaleX: [1, 4, 1],
            opacity: [1, 0.5, 1],
            transition: { duration: 0.8 },
          });
        });
      },
    }));

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
          {description && (
            <CardDescription>
              <MathResInline>{description}</MathResInline>
            </CardDescription>
          )}
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
          {answers.length > 0 && (
            <Collapsible
              id={`problem-${id}-answers`}
              open={answerRecordOpen}
              onOpenChange={toggleAnswerRecord}
              className="rounded-md data-[state=open]:bg-muted"
            >
              <CollapsibleTrigger asChild>
                <motion.div animate={anwsers} className="rounded-md">
                  <Button variant="ghost" className="group w-full">
                    <Clock className="size-4" /> {t("problem.answerRecord")}
                    <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                  </Button>
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2.5 pt-0 text-sm">
                {answers.map((it, i) => {
                  const analysis = answerAnalysesMap[it.id];
                  return (
                    <div key={it.id}>
                      {i > 0 && <Separator className="my-3" />}
                      <div className="flex items-start gap-2">
                        {analysis ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span
                                className={cn(
                                  "mt-1.5 size-2 shrink-0 rounded-full cursor-help",
                                  "hover:ring-2 hover:ring-offset-1 hover:ring-offset-background transition-all",
                                  it.correct
                                    ? cn(
                                        PROBLEM_STATE_COLORS.correct,
                                        "hover:ring-green-600/40",
                                      )
                                    : cn(
                                        PROBLEM_STATE_COLORS.incorrect,
                                        "hover:ring-amber-600/40",
                                      ),
                                )}
                              />
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="right"
                              className="max-w-xs sm:max-w-sm"
                            >
                              <p className="text-xs text-muted-foreground mb-1">
                                {t("problem.aiFeedback")}
                              </p>
                              <MathResBlock>{analysis.content}</MathResBlock>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <span
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              it.correct
                                ? PROBLEM_STATE_COLORS.correct
                                : PROBLEM_STATE_COLORS.incorrect,
                            )}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <MathResBlock>{it.user_answer}</MathResBlock>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          )}

          {problemExplanations && problemExplanations.length > 0 && (
            <Collapsible
              id={`problem-${id}-explanation`}
              open={explanationOpen}
              onOpenChange={toggleExplanation}
              className="rounded-md data-[state=open]:bg-muted"
            >
              <CollapsibleTrigger asChild>
                <motion.div animate={expplations} className="rounded-md">
                  <Button variant="ghost" className="group w-full">
                    <BadgeQuestionMark className="size-4" />
                    {t("problem.explanation")}
                    <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                  </Button>
                </motion.div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2.5 pt-0 text-sm space-y-2">
                {problemExplanations.map((exp, i) => (
                  <div key={exp.id}>
                    {i > 0 && <Separator className="my-2" />}
                    <MathResBlock>{exp.content}</MathResBlock>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
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
