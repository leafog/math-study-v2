import { useCallback, useMemo } from "react";
import {
  BadgeQuestionMark,
  Clock,
  FileQuestion,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActiveChat, useChatProblems } from "~/hooks/chat/active-chat";

import {
  FileTree,
  FileTreeActions,
  FileTreeFile,
  FileTreeFolder,
  FileTreeIcon,
  FileTreeName,
} from "~/components/ai-elements/file-tree";
import { scrollToProblem } from "~/components/math/scroll-utils";
import { usePinnedProblems } from "~/store/pinned-problems-store";
import StatusIcon from "~/components/math/status-icon";
import { cn } from "~/lib/utils";
import MathResInLine from "../math/math-res-inline";
import { eq, inArray, useLiveQuery } from "@tanstack/react-db";
import { attachmentMetaDataColl } from "~/db/tdb-collections";
import { groupBy } from "lodash-es";

const ChatProblemsList = () => {
  const { t } = useTranslation();
  const { chatId } = useActiveChat();

  const { problems, problemHasanswers, problemHasExplanations } =
    useChatProblems();
  const attIds = useMemo(
    () =>
      new Set(
        problems
          .map((it) => it.source_attachment_id)
          .filter((it) => it !== null && it !== undefined),
      ),
    [problems],
  );

  const pinned = usePinnedProblems((s) => s.pinned);
  const togglePin = usePinnedProblems((s) => s.toggle);
  const pinnedId = pinned[chatId];

  const { data: attMetas } = useLiveQuery(
    (q) =>
      q
        .from({ attachmentMetaDataColl })
        .where(({ attachmentMetaDataColl }) =>
          inArray(attachmentMetaDataColl.id, [...attIds]),
        ),
    [attIds],
  );
  const attMetasMap = useMemo(
    () => groupBy(attMetas, (it) => it.id),
    [attMetas],
  );

  type ChatProblem = NonNullable<typeof problems>[number];

  // 按 tool_call_id 分组:同一工具调用产出的题目归一组
  const groups = useMemo(() => {
    const map = new Map<string, { key: string; items: ChatProblem[] }>();
    for (const p of problems ?? []) {
      const key = p.tool_call_id ?? "";
      const g = map.get(key) ?? { key, items: [] };
      g.items.push(p);
      map.set(key, g);
    }
    return [...map.values()];
  }, [problems]);

  // 组标题:组内 source_attachment_id 全一致 → 用附件 origin_filename;
  // 否则用工具 i18n 标题;仍取不到则回退到工具调用 id / 默认分组
  const groupLabel = useCallback(
    (g: { key: string; items: ChatProblem[] }): string => {
      const firstAtt = g.items[0]?.source_attachment_id;
      const allSameAtt =
        firstAtt != null &&
        g.items.every((p) => p.source_attachment_id === firstAtt);
      if (allSameAtt) {
        const name = attMetasMap[firstAtt]?.[0]?.origin_filename;
        if (name) return name;
      }
      return t("problem.defaultGroup");
    },
    [attMetasMap, t],
  );

  const defaultExpanded = useMemo(
    () => new Set(groups.filter((g) => g.items.length > 1).map((g) => g.key)),
    [groups],
  );

  // 单个题的渲染(单题分组直接平铺,多题分组放进文件夹)
  const renderProblem = (p: NonNullable<typeof problems>[number]) => (
    <FileTreeFile
      key={p.id}
      path={p.id}
      name={p.description || p.content.slice(0, 40)}
    >
      <FileTreeIcon>
        <StatusIcon status={p.status} />
      </FileTreeIcon>
      <FileTreeName>
        <MathResInLine>{p.description || p.content.slice(0, 40)}</MathResInLine>
      </FileTreeName>
      <FileTreeActions>
        {problemHasanswers(p.id) && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer"
            role="button"
            tabIndex={-1}
          >
            <Clock className="size-3 text-muted-foreground" />
          </span>
        )}
        {problemHasExplanations(p.id) && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            className="shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer"
            role="button"
            tabIndex={-1}
          >
            <BadgeQuestionMark className="size-3 text-muted-foreground" />
          </span>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            togglePin(chatId, p.id);
          }}
          className={cn("shrink-0 rounded p-0.5 hover:bg-muted cursor-pointer")}
          role="button"
          tabIndex={-1}
        >
          {pinnedId === p.id ? (
            <PinOffIcon className="size-3 text-primary" />
          ) : (
            <PinIcon className="size-3 text-muted-foreground" />
          )}
        </span>
      </FileTreeActions>
    </FileTreeFile>
  );

  if (!problems?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
        <FileQuestion className="size-5 opacity-40" aria-hidden="true" />
        <p className="text-xs">{t("problem.empty")}</p>
      </div>
    );
  }

  return (
    <FileTree
      defaultExpanded={defaultExpanded}
      selectedPath={pinnedId}
      onSelect={(pid) => {
        const p = problems.find((it) => it.id === pid);
        if (p?.tool_call_id) {
          scrollToProblem(p.id, p.tool_call_id);
        }
      }}
      className="border-none bg-transparent font-sans text-xs"
    >
      {groups.map((group) =>
        group.items.length === 1 ? (
          renderProblem(group.items[0]!)
        ) : (
          <FileTreeFolder
            key={group.key}
            path={group.key}
            name={groupLabel(group)}
          >
            {group.items.map(renderProblem)}
          </FileTreeFolder>
        ),
      )}
    </FileTree>
  );
};

export default ChatProblemsList;
