import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";

export const SearchSimilarTopics = ({
  part,
}: ToolRendererProps<"tool-searchSimilarTopics">) => {
  const { t } = useTranslation();

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.searchingSimilar"
      doneText={t("toolCall.searchComplete")}
      errorKey="toolCall.searchSimilarFailed"
    />
  );
};
