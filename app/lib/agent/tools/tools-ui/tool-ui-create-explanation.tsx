import { useTranslation } from "react-i18next";
import { CornerUpRight } from "lucide-react";
import { ToolCallLabel } from "./_tool-call-label";
import { scrollToProblemAndOpenExplanation } from "~/components/math/scroll-utils";
import { Button } from "~/components/ui/button";
import type { ToolMessageRendererProps } from "./types";

function CreateExplanationRenderer({
  part,
}: Readonly<ToolMessageRendererProps>) {
  const { t } = useTranslation();

  const isDone = part.state === "output-available";
  const problemId = isDone
    ? (part as { input?: { problem_id?: string } }).input?.problem_id
    : undefined;

  return (
    <div className="flex items-center gap-2">
      <ToolCallLabel
        state={part.state}
        loadingKey="toolCall.creatingExplanation"
        doneText={isDone ? t("toolCall.explanationCreated") : undefined}
        errorKey="toolCall.createExplanationFailed"
      />
      {isDone && problemId && (
        <Button
          variant="ghost"
          size="xs"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => scrollToProblemAndOpenExplanation(problemId)}
        >
          <CornerUpRight className="size-3 mr-1" />
          {t("problem.viewExplanation")}
        </Button>
      )}
    </div>
  );
}

export const kind = "tool-createExplanation";
export const Renderer = CreateExplanationRenderer;
