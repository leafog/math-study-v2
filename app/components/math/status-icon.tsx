import {
  CircleHelp,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { type ProblemStatus } from "./constants";
import { cn } from "~/lib/utils";

const STATUS_ICONS: Record<ProblemStatus, LucideIcon> = {
  unanswered: CircleHelp,
  correct: CheckCircle,
  incorrect: XCircle,
};

const STATUS_ICON_COLORS: Record<ProblemStatus, string> = {
  unanswered: "text-gray-400 dark:text-gray-500",
  correct: "text-green-600 dark:text-green-500",
  incorrect: "text-amber-600 dark:text-amber-500",
};

const StatusIcon = ({ status }: { status: ProblemStatus }) => {
  const Icon = STATUS_ICONS[status];
  return (
    <Icon className={cn("size-3.5 shrink-0", STATUS_ICON_COLORS[status])} />
  );
};

export default StatusIcon;
