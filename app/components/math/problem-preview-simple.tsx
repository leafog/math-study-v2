import { BadgeQuestionMark, Clock, PinOffIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLiveQuery, eq } from "@tanstack/react-db";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";
import {
  problemColl,
  answerRecordColl,
  problemExplanationColl,
} from "~/db/tdb-collections";
import {
  scrollToProblemAndOpenAnswerRecords,
  scrollToProblemAndOpenExplanation,
} from "./scroll-utils";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import { Tool } from "../ai-elements/tool";
import CopyButton from "../common-ui/copy-button";
import MathResBlock from "./math-res-block";

export interface ProblemPreviewProps {
  problemId: string;
  chatId: string;
  pinnedDivHeight: number | null;
}

export function ProblemPreviewSimple({
  problemId,
  chatId,
  pinnedDivHeight,
}: Readonly<ProblemPreviewProps>) {
  const { t } = useTranslation();
  const togglePin = usePinnedProblems((s) => s.toggle);

  const { data: problem } = useLiveQuery(
    (q) =>
      q
        .from({ problemColl })
        .where(({ problemColl: col }) => eq(col.id, problemId))
        .findOne(),
    [problemId],
  );

  const { data: answers = [] } = useLiveQuery(
    (q) =>
      q
        .from({ answerRecordColl })
        .where(({ answerRecordColl: col }) => eq(col.problem_id, problemId)),
    [problemId],
  );

  const { data: explanations = [] } = useLiveQuery(
    (q) =>
      q
        .from({ problemExplanationColl })
        .where(({ problemExplanationColl: col }) =>
          eq(col.problem_id, problemId),
        ),
    [problemId],
  );

  if (!problem) return null;

  const hasAnswers = answers.length > 0;
  const hasExplanation = explanations.length > 0;

  return (
    <Card className="border-0 shadow-none bg-background">
      <CardHeader className="pb-2">
        {problem.description && (
          <CardDescription>{problem.description}</CardDescription>
        )}
        <CardAction>
          <ButtonGroup>
            <CopyButton text={problem.content} />
            {hasAnswers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      scrollToProblemAndOpenAnswerRecords(problemId);
                    }}
                  >
                    <Clock className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("problem.answerRecord")}</TooltipContent>
              </Tooltip>
            )}
            {hasExplanation && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      scrollToProblemAndOpenExplanation(problemId);
                    }}
                  >
                    <BadgeQuestionMark className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("problem.viewExplanation")}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => togglePin(chatId, problemId)}
                >
                  <PinOffIcon className="size-4 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("problem.unpin")}</TooltipContent>
            </Tooltip>
          </ButtonGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-48 overflow-y-auto  text-sm scrollbar-thin">
          <MathResBlock>{problem.content}</MathResBlock>
        </div>
      </CardContent>
    </Card>
  );
}
