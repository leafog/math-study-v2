import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessageResponse } from "../ai-elements/message";
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
import type {
  AnswerRecord,
  Problem,
  AnswerAnalysis,
  KgTopic,
  ProblemExplanation,
} from "~/db/db-zod-schema";
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
import {
  onOpenExplanation,
  onOpenAnswerRecords,
  onScrollToProblem,
} from "./scroll-utils";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { useBoolean } from "usehooks-ts";

export interface ProblemProps {
  problem: Problem;
  answers: AnswerRecord[];
  answerAnalyses: AnswerAnalysis[];
  kgTopics: KgTopic[];
  problemExplanations?: ProblemExplanation[];
  className?: string;
  chatId?: string;
}

const ProblemPreview = ({
  problem,
  answers,
  answerAnalyses,
  kgTopics,
  problemExplanations: explanations,
  className,
  chatId,
}: ProblemProps) => {
  const { t } = useTranslation();
  const { id, content, description } = problem;

  const correctOnce = answers.some((it) => it.correct);

  const barColor =
    answers.length === 0
      ? "bg-muted-foreground"
      : correctOnce
        ? "bg-primary"
        : "bg-destructive";

  const getAnalysis = (answerId: string) =>
    answerAnalyses.find((a) => a.answer_id === answerId);

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

  useEffect(() => {
    if (!id) return;
    const unsub1 = onOpenExplanation((problemId) => {
      if (problemId === id) openExplanation();
    });
    const unsub2 = onOpenAnswerRecords((problemId) => {
      if (problemId === id) openAnswerRecord();
    });
    const unsub3 = onScrollToProblem((problemId) => {
      if (problemId === id) {
        console.log("pid");
      }
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [id, openExplanation, openAnswerRecord]);

  return (
    <Card className={cn("my-3 min-w-0 relative m-1", className)}>
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          barColor,
        )}
      />
      <CardHeader className="pb-1 pl-5">
        {description && <CardDescription>{description}</CardDescription>}
        <CardAction>
          <ButtonGroup>
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
          <MessageResponse>{content}</MessageResponse>
        </div>

        {answers.length > 0 && (
          <Collapsible
            open={answerRecordOpen}
            onOpenChange={toggleAnswerRecord}
            className="rounded-md data-[state=open]:bg-muted"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <Clock className="size-4" /> {t("problem.answerRecord")}
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2.5 pt-0 text-sm">
              {answers.map((it, i) => {
                const analysis = getAnalysis(it.id);
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
                                  ? "bg-primary hover:ring-primary/40"
                                  : "bg-destructive hover:ring-destructive/40",
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
                            <MessageResponse>
                              {analysis.content}
                            </MessageResponse>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            it.correct ? "bg-primary" : "bg-destructive",
                          )}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <MessageResponse>{it.user_answer}</MessageResponse>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        {explanations && explanations.length > 0 && (
          <Collapsible
            open={explanationOpen}
            onOpenChange={toggleExplanation}
            className="rounded-md data-[state=open]:bg-muted"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group w-full">
                <BadgeQuestionMark className="size-4" />
                {t("problem.explanation")}
                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-2.5 pt-0 text-sm space-y-2">
              {explanations.map((exp, i) => (
                <div key={exp.id}>
                  {i > 0 && <Separator className="my-2" />}
                  <MessageResponse>{exp.content}</MessageResponse>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>

      {kgTopics.length > 0 && (
        <CardFooter className="flex flex-wrap gap-1 pt-0 pb-3 pl-5">
          {kgTopics.map((topic) => (
            <Badge key={topic.id} variant="secondary" className="text-xs">
              {topic.i18n?.zh ?? topic.name}
            </Badge>
          ))}
        </CardFooter>
      )}
    </Card>
  );
};

export default ProblemPreview;
