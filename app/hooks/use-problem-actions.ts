import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { Problem } from "~/db/db-zod-schema";
import { useActiveChat } from "~/hooks/chat/active-chat";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";

const useProblemActions = (problem: Problem) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, copyToClipboard] = useCopyToClipboard();
  const { isNewChat } = useActiveChat();
  const setProblemIds = useChatPromptInput().use.setProblemIds();

  // 用当前题目开始聊天：把题目 id 写入 prompt 草稿后跳到聊天
  const startChat = () => {
    if (!problem.id) return;
    if (isNewChat) {
      setProblemIds([problem.id]);
    }
    navigate("/", { state: { problemIds: [problem.id] } });
  };

  const viewInChat = (chat_id: string) => {
    navigate(`/chat/${chat_id}?problemId=${problem.id}`);
  };

  const copy = async () => {
    if (!problem.content) {
      toast.error(t("common.copy.empty"), { position: "top-center" });
      return;
    }
    await copyToClipboard(problem.content);
    toast.success(t("common.copy.success"), { position: "top-center" });
  };

  return { startChat, viewInChat, copy };
};

export default useProblemActions;
