import { useTranslation } from "react-i18next";
import { ToolCallLabel } from "./_tool-call-label";
import type { ToolMessageRendererProps } from "./types";

function CreateRelationshipRenderer({ part }: ToolMessageRendererProps) {
  const { t } = useTranslation();

  return (
    <ToolCallLabel
      state={part.state}
      loadingKey="toolCall.buildingRelation"
      doneText={t("toolCall.relationBuilt")}
      errorKey="toolCall.buildRelationFailed"
    />
  );
}

export const kind = "tool-createRelationship";
export const Renderer = CreateRelationshipRenderer;
