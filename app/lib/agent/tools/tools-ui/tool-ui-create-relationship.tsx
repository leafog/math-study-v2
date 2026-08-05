import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolRendererProps } from "./types";

export const CreateRelationship = ({
  part,
}: ToolRendererProps<"tool-createRelationship">) => {
  const { t } = useTranslation();

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.buildingRelation"
      doneText={t("toolCall.relationBuilt")}
      errorKey="toolCall.buildRelationFailed"
    />
  );
};
