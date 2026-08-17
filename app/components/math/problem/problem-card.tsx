import MathRes from "../math-res";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, NotebookPen, MessageSquare, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import useProblemActions from "~/hooks/use-problem-actions";
import MathResInLine from "../math-res-inline";
import MathResBlock from "../math-res-block";

const ProblemCard = ({
  problem,
  inChats = [],
  onCardContentClick,
}: {
  problem: Problem;
  inChats: {
    chat_id: string;
    title: string;
  }[];
  onCardContentClick?: (problem: Problem) => void;
}) => {
  const { t } = useTranslation();
  const { practice, viewInChat, copy } = useProblemActions(problem);

  return (
    <Card size="sm" className="mx-auto w-full max-w-sm h-64">
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-1.5">
          <StatusIcon status={problem.status} />
          <MathResInLine>{problem.description}</MathResInLine>
        </CardTitle>

        <CardAction className="opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon-sm">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={practice}>
                  <NotebookPen />
                  {t("problem.practice")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copy}>
                  <Copy />
                  {t("problem.copy")}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              {inChats.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      {t("problem.viewInChat")}
                    </DropdownMenuLabel>
                    {inChats.map(({ chat_id, title }) => (
                      <DropdownMenuItem
                        key={chat_id}
                        onClick={(e) => {
                          viewInChat(chat_id);
                        }}
                      >
                        <MessageSquare />
                        <span className=" truncate line-clamp-1">{title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent
        className="overflow-hidden  h-full  hover:cursor-pointer"
        onClick={(e) => {
          onCardContentClick?.(problem);
        }}
      >
        <MathResBlock>{problem.content}</MathResBlock>
      </CardContent>
    </Card>
  );
};

export default ProblemCard;
