import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";

export const GetKnowledgeGraph = ({
  part,
}: ToolRendererProps<"tool-getKnowledgeGraph">) => {
  const { t } = useTranslation();

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.fetchingGraph"
      doneText={t("toolCall.graphFetched")}
      errorKey="toolCall.fetchGraphFailed"
    />
  );
};
