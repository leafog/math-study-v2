import { useTranslation } from "react-i18next";
import { ToolBlock } from "./_tool-common";
import { ProblemBatchView } from "./_problem-batch-view";
import type { ToolRendererProps } from "./types";

/**
 * 批量建题的聊天 UI：把一次 createProblemsByAttachment 建出的多道题放进一个轮播，
 * 逐题可作答/判题/看解析，避免一次性把一堆题目卡片刷屏。
 */
export const CreateProblemsByAttachment = ({
  part,
}: ToolRendererProps<"tool-createProblemsByAttachment">) => {
  const { t } = useTranslation();

  const output = part.state === "output-available" ? part.output : null;
  const ids = output?.ids ?? [];

  return (
    <ToolBlock
      title={t("toolCall.title.createProblemsByAttachment")}
      part={part}
    >
      {output && ids.length > 0 && (
        <ProblemBatchView ids={ids} chatId={output.chat_id ?? undefined} />
      )}
    </ToolBlock>
  );
};
