import { MessageResponse } from "~/components/ai-elements/message";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { Problem } from "~/db/db-zod-schema";
import StatusIcon from "~/components/math/status-icon";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, NotebookPen, MessageSquare, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import useProblemActions from "~/hooks/use-problem-actions";

const ProblemCard = ({
  problem,
  onCardContentClick,
}: {
  problem: Problem;
  onCardContentClick?: (problem: Problem) => void;
}) => {
  const { t } = useTranslation();
  const { practice, viewInChat, copy } = useProblemActions(problem);

  return (
    <Card size="sm" className="mx-auto w-full max-w-sm h-64">
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-1.5">
          <StatusIcon status={problem.status} />
          <span className="truncate">{problem.description}</span>
        </CardTitle>

        <CardAction className="opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={practice}>
                <NotebookPen />
                {t("problem.practice")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={viewInChat}>
                <MessageSquare />
                {t("problem.viewInChat")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copy}>
                <Copy />
                {t("problem.copy")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent
        className="overflow-hidden m-auto hover:cursor-pointer"
        onClick={(e) => {
          onCardContentClick?.(problem);
        }}
      >
        <MessageResponse>{problem.content}</MessageResponse>
      </CardContent>
    </Card>
  );
};

export default ProblemCard;
