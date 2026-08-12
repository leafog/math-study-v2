import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { ToolInline } from "./_tool-common";

export const GetKnowledgeGraph = ({
  part,
}: ToolRendererProps<"tool-getKnowledgeGraph">) => {
  const { t } = useTranslation();

  return (
    <ToolInline title={t("toolCall.title.getKnowledgeGraph")} part={part} />
  );
};
