import { useTranslation } from "react-i18next";
import { ToolBlock } from "./_tool-common";
import type { ToolRendererProps } from "./types";
import { ConnectedProblemView } from "./_problem-view";

export const CreateProblem = ({
  part,
}: ToolRendererProps<"tool-createProblem">) => {
  const { t } = useTranslation();
  return (
    <ToolBlock title={t("toolCall.title.createProblem")} part={part}>
      {part.state === "output-available" && (
        <div id={`problem-${part.output.id}`}>
          <ConnectedProblemView
            problemId={part.output.id}
            chatId={part.output.chat_id ?? undefined}
          />
        </div>
      )}
    </ToolBlock>
  );
};
