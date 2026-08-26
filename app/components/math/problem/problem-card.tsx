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
import {
  Copy,
  Eye,
  MessageSquare,
  MoreHorizontal,
  NotebookPen,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useProblemActions from "~/hooks/use-problem-actions";
import MathResInLine from "../math-res-inline";
import MathResBlock from "../math-res-block";
import { Checkbox } from "~/components/ui/checkbox";
import { cn } from "~/lib/utils";

/**
 * 题库卡片：参考文件卡片的结构。
 * - 点击卡片内容 / 右下角勾选 → 选择
 * - 右上角下拉菜单：选择 / 开始聊天 / 查看详情 / 复制 / 在聊天中查看
 */
export interface ProblemCardProps extends React.ComponentProps<typeof Card> {
  problem: Problem;
  inChats?: { chat_id: string; title: string }[];

  selected?: boolean;
  onSelectedChange?: (id: string, checked: boolean) => void;

  /** 打开详情弹窗 */
  onViewDetail?: (problem: Problem) => void;
}

const ProblemCard = ({
  problem,
  inChats = [],
  selected,
  onSelectedChange,
  onViewDetail,
  className,
  ...cardProps
}: ProblemCardProps) => {
  const { t } = useTranslation();
  const { startChat, viewInChat, copy } = useProblemActions(problem);

  return (
    <Card
      {...cardProps}
      className={cn(
        "group/card relative overflow-hidden mx-auto w-full max-w-sm h-64 transition-colors hover:bg-muted",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        className,
      )}
    >
      {/* 标题与操作菜单为卡片外壳，不挡点击 */}

      <CardHeader className="relative z-10">
        <CardTitle className="flex min-w-0 items-center gap-1.5">
          <StatusIcon status={problem.status} />

          <MathResInLine>{problem.description}</MathResInLine>
        </CardTitle>
        <CardAction className="opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                className="bg-background"
                size="icon-sm"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={startChat}>
                  <NotebookPen />
                  {t("problem.startChat")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewDetail?.(problem)}>
                  <Eye />
                  {t("problem.viewProblem")}
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
                        onClick={() => viewInChat(chat_id)}
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
        className="overflow-hidden h-full hover:cursor-pointer"
        onClick={() => onSelectedChange?.(problem.id, !selected)}
      >
        <MathResBlock>{problem.content}</MathResBlock>
        <Checkbox
          className={cn(
            "rounded-full bg-background absolute right-5 bottom-5 size-6 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100",
            selected ? "opacity-100" : "opacity-0",
          )}
          checked={selected}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) =>
            onSelectedChange?.(problem.id, checked === true)
          }
        />
      </CardContent>
    </Card>
  );
};

export default ProblemCard;
