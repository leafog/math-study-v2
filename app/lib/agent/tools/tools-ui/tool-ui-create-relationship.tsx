import { useTranslation } from "react-i18next";
import type { ToolRendererProps } from "./types";
import { ToolInline } from "./_tool-common";

export const CreateRelationship = ({
  part,
}: ToolRendererProps<"tool-createRelationship">) => {
  const { t } = useTranslation();
  return (
    <ToolInline title={t("toolCall.title.createRelationship")} part={part} />
  );
};
