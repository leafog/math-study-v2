import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { ToolBlock } from "./_tool-common";
import MathResBlock from "~/components/math/math-res-block";
import CopyButton from "~/components/common-ui/copy-button";

export const CreateExplanation = ({
  part,
}: ToolRendererProps<"tool-createExplanation">) => {
  const { t } = useTranslation();

  return (
    <ToolBlock title={t("toolCall.title.createExplanation")} part={part}>
      {part.state === "output-available" && (
        <div className="relative space-y-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
          <div className="absolute right-2 top-2">
            <CopyButton text={part.input.content} />
          </div>
          <MathResBlock>{part.input.content}</MathResBlock>
        </div>
      )}
    </ToolBlock>
  );
};
