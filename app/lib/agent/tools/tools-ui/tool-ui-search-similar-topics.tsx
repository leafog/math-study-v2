import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { ToolInline } from "./_tool-common";

export const SearchSimilarTopics = ({
  part,
}: ToolRendererProps<"tool-searchSimilarTopics">) => {
  const { t } = useTranslation();
  return (
    <ToolInline title={t("toolCall.title.searchSimilarTopics")} part={part} />
  );
};
