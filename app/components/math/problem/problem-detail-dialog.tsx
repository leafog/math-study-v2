import type { Problem } from "~/db/db-zod-schema";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import StatusIcon from "../status-icon";
import MathResBlock from "../math-res-block";
import MathResInline from "../math-res-inline";
import { NotebookPen, MessageSquare, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import useProblemActions from "~/hooks/use-problem-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ProblemDetailDialogProps {
  problem: Problem | null;
  onClose: () => void;
  inChats: { chat_id: string; title: string }[];
}

const ProblemDetailDialog = ({
  problem,
  inChats = [],
  onClose,
}: ProblemDetailDialogProps) => {
  const { t } = useTranslation();
  const { startChat, viewInChat, copy } = useProblemActions(problem!);

  return (
    <Dialog
      open={problem !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {problem && (
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-2xl"
          onOpenAutoFocus={(e) => {
            // 避免打开时自动聚焦到 CopyButton 而误触 tooltip，聚焦到容器本身
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex min-w-0 items-center gap-1.5">
              <StatusIcon status={problem.status} />
              <MathResInline>{problem.description}</MathResInline>
            </DialogTitle>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[70vh] overflow-y-auto px-4">
            <MathResBlock>{problem.content}</MathResBlock>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copy}>
              <Copy />
              {t("problem.copy")}
            </Button>

            <Button onClick={startChat}>
              <NotebookPen />
              {t("problem.practice")}
            </Button>
            {inChats.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"}>{t("problem.viewInChat")}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ProblemDetailDialog;
