import { useTranslation } from "react-i18next";
import { Spinner } from "~/components/ui/spinner";

export function ToolCallLabel({
  state,
  loadingKey,
  doneText,
  errorKey,
}: Readonly<{
  state: string;
  loadingKey: string;
  doneText?: string | null;
  errorKey?: string;
}>) {
  const { t } = useTranslation();

  if (state === "output-error") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive py-1">
        <span className="text-[10px]">✕</span>
        <span>{t(errorKey!, t("toolCall.execFailed"))}</span>
      </div>
    );
  }

  if (state === "output-available") {
    if (!doneText) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary py-1">
        <span>✓</span>
        <span>{doneText}</span>
      </div>
    );
  }

  // input-streaming | input-available → loading
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
      <Spinner className="size-3" />
      <span>{t(loadingKey)}</span>
    </div>
  );
}
