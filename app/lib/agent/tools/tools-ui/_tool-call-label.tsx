import { useTranslation } from "react-i18next";
import { Spinner } from "~/components/ui/spinner";
import type { AgentToolState } from "./types";
import { Badge } from "~/components/ui/badge";
import { Check, X } from "lucide-react";

export function ToolCallLabel({
  state,
  loadingKey,
  doneText,
  errorKey,
}: Readonly<{
  state: AgentToolState;
  loadingKey: string;
  doneText?: string | null;
  errorKey?: string;
}>) {
  const { t } = useTranslation();

  if (state === "input-streaming") {
    return (
      <Badge variant="secondary">
        <Spinner data-icon="inline-start" />
        {t(loadingKey)}
      </Badge>
    );
  }

  if (state === "output-error") {
    return (
      <Badge variant="destructive">
        <X data-icon="inline-start" />
        {errorKey ? t(errorKey) : t("common.error")}
      </Badge>
    );
  }

  if (state === "output-available") {
    if (!doneText) return null;
    return (
      <Badge>
        <Check data-icon="inline-start" />
        {doneText}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
      <Spinner className="size-3" />
      <span>{t(loadingKey)}</span>
    </div>
  );
}
