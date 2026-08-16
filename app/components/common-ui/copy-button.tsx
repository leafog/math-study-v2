import { useCallback } from "react";
import { useCopyToClipboard } from "@uidotdev/usehooks";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageAction } from "../ai-elements/message";
import { CopyIcon } from "lucide-react";

const CopyButton = ({ text }: { text: string | undefined }) => {
  const { t } = useTranslation();
  const [, copyToClipboard] = useCopyToClipboard();

  const handleCopy = useCallback(async () => {
    if (!text) {
      toast.error(t("common.copy.empty"), { position: "top-center" });
      return;
    }
    await copyToClipboard(text);
    toast.success(t("common.copy.success"), { position: "top-center" });
  }, [text, copyToClipboard, t]);

  return (
    <MessageAction label="Copy" onClick={handleCopy} tooltip="copy">
      <CopyIcon />
    </MessageAction>
  );
};

export default CopyButton;
