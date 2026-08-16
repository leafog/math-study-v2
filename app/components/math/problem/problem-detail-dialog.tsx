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
import { MessageResponse } from "~/components/ai-elements/message";
import { NotebookPen, MessageSquare, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import useProblemActions from "~/hooks/use-problem-actions";

interface ProblemDetailDialogProps {
  problem: Problem | null;
  onClose: () => void;
}

const ProblemDetailDialog = ({
  problem,
  onClose,
}: ProblemDetailDialogProps) => {
  const { t } = useTranslation();
  const { practice, viewInChat, copy } = useProblemActions(problem!);

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
              <MessageResponse className="min-w-0 flex-1 [*_p]:truncate line-clamp-1">
                {problem.description}
              </MessageResponse>
            </DialogTitle>
          </DialogHeader>
          <div className="-mx-4 no-scrollbar max-h-[70vh] overflow-y-auto px-4">
            <MessageResponse>{problem.content}</MessageResponse>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copy}>
              <Copy />
              {t("problem.copy")}
            </Button>
            <Button variant="outline" onClick={viewInChat}>
              <MessageSquare />
              {t("problem.viewInChat")}
            </Button>
            <Button onClick={practice}>
              <NotebookPen />
              {t("problem.practice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ProblemDetailDialog;
