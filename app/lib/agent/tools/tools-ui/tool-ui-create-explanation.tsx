import { useTranslation } from "react-i18next";
import { CornerUpRight } from "lucide-react";
import { scrollToProblemAndOpenExplanation } from "~/components/math/scroll-utils";
import { Button } from "~/components/ui/button";
import type { ToolRendererProps } from "./types";
import { ToolInline } from "./_tool-common";

export const CreateExplanation = ({
  part,
}: ToolRendererProps<"tool-createExplanation">) => {
  const { t } = useTranslation();
  const isDone = part.state === "output-available";
  const problemId = isDone ? part.input.problem_id : undefined;

  return (
    <ToolInline title={t("toolCall.title.createExplanation")} part={part}>
      {isDone && problemId && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => scrollToProblemAndOpenExplanation(problemId)}
        >
          <CornerUpRight className="size-3 mr-1" />
          {t("problem.viewExplanation")}
        </Button>
      )}
    </ToolInline>
  );
};
