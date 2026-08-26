import { useTranslation } from "react-i18next";
import { ToolBlock } from "./_tool-common";
import { ProblemBatchView } from "./_problem-batch-view";
import type { ToolRendererProps } from "./types";

/**
 * 批量练习的聊天 UI：把一次 practiceProblems 关联的已存在题目放进轮播展示，
 * 与批量创建共用 ProblemBatchView，逐题可作答/判题/看解析。
 */
export const PracticeProblems = ({
  part,
}: ToolRendererProps<"tool-practiceProblems">) => {
  const { t } = useTranslation();

  const output = part.state === "output-available" ? part.output : null;
  const ids = output?.ids ?? [];

  return (
    <ToolBlock title={t("toolCall.title.practiceProblems")} part={part}>
      {output && ids.length > 0 && (
        <ProblemBatchView ids={ids} chatId={output.chat_id ?? undefined} />
      )}
    </ToolBlock>
  );
};
