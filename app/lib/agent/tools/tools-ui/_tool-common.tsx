import { type PropsWithChildren, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { AgentToolPart } from "./types";
import {
  ClockIcon,
  CheckCircleIcon,
  CircleIcon,
  XCircleIcon,
  WrenchIcon,
  Wrench,
} from "lucide-react";
import { type ToolPart } from "~/components/ai-elements/tool";
import { Badge } from "~/components/ui/badge";

const STATUS_I18N_KEYS: Record<ToolPart["state"], string> = {
  "approval-requested": "toolCall.status.approvalRequested",
  "approval-responded": "toolCall.status.approvalResponded",
  "input-available": "toolCall.status.inputAvailable",
  "input-streaming": "toolCall.status.inputStreaming",
  "output-available": "toolCall.status.outputAvailable",
  "output-denied": "toolCall.status.outputDenied",
  "output-error": "toolCall.status.outputError",
};

const statusIcons: Record<ToolPart["state"], ReactNode> = {
  "approval-requested": <ClockIcon className="size-4 text-yellow-600" />,
  "approval-responded": <CheckCircleIcon className="size-4 text-blue-600" />,
  "input-available": <ClockIcon className="size-4 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-4" />,
  "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
  "output-denied": <XCircleIcon className="size-4 text-orange-600" />,
  "output-error": <XCircleIcon className="size-4 text-red-600" />,
};

const ToolState = ({
  title,
  state,
}: {
  title: string;
  state: ToolPart["state"];
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <div className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
        {statusIcons[state]}
        {t(STATUS_I18N_KEYS[state])}
      </Badge>
    </div>
  );
};

export const ToolInline = ({
  children,
  part,
  title,
}: PropsWithChildren<{
  part: AgentToolPart;
  title?: string;
}>) => {
  return (
    <div className="flex flex-row gap-2 items-center align-middle">
      <ToolState title={title ?? ""} state={part.state}></ToolState>
      {part.state === "output-available" && children}
    </div>
  );
};
export const ToolBlock = ({
  children,
  part,
  title,
}: PropsWithChildren<{
  part: AgentToolPart;
  title?: string;
}>) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="w-full">
        <ToolState title={title ?? ""} state={part.state}></ToolState>
      </div>
      {part.state === "output-available" && children}
    </div>
  );
};
