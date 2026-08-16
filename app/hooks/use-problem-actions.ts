import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Problem } from "~/db/db-zod-schema";

const useProblemActions = (problem: Problem) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, copyToClipboard] = useCopyToClipboard();

  const practice = () => {
    // TODO: 练习流程尚未设计,后续补充具体行为
  };

  const viewInChat = () => {
    if (problem.chat_id) {
      navigate(`/chat/${problem.chat_id}?problemId=${problem.id}`);
    }
  };

  const copy = async () => {
    if (!problem.content) {
      toast.error(t("common.copy.empty"), { position: "top-center" });
      return;
    }
    await copyToClipboard(problem.content);
    toast.success(t("common.copy.success"), { position: "top-center" });
  };

  return { practice, viewInChat, copy };
};

export default useProblemActions;
