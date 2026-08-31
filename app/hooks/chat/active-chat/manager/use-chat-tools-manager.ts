import { useCallback, useEffect, useMemo } from "react";
import { and, eq, queryOnce, useLiveQuery } from "@tanstack/react-db";
import {
  chatToolInstanceColl,
  chatToolsBarStateColl,
  toolDataColl,
} from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { useImmer } from "use-immer";
import { hasToolKind } from "~/components/chat/tools";
import { keyBy, without } from "lodash-es";
import { moveToEnd } from "~/lib/coll-utils";
import { useRxEvent } from "~/event/events";
import { ChatToolInstanceSchema } from "~/db/db-zod-schema";

export const useChatToolsManager = (
  chatId: string,
  onOpenBefore?: (kind: string, title?: string) => void,
) => {
  const { data: chatToolsBarState } = useLiveQuery(
    {
      query: (q) =>
        q
          .from({ chatToolsBarStateColl })
          .where(({ chatToolsBarStateColl }) =>
            eq(chatToolsBarStateColl.id, chatId),
          )
          .findOne(),
    },
    [chatId],
  );

  const { data: chatToolInstances = [] } = useLiveQuery(
    (q) => {
      if (!chatToolsBarState?.tool_order) return undefined;
      return q
        .from({ chatToolInstanceColl })
        .where(({ chatToolInstanceColl }) =>
          eq(chatToolInstanceColl.chat_id, chatId),
        );
    },
    [chatId],
  );

  const chatToolInstancesMap = useMemo(() => {
    return keyBy(chatToolInstances, "id");
  }, [chatToolInstances]);

  const { active_id, tool_order, actived_history } = chatToolsBarState ?? {};
  const [mountedToolsIds, setMountedToolsIds] = useImmer<Set<string>>(
    new Set(),
  );

  // 切换 chat 时重置挂载集
  useEffect(() => {
    setMountedToolsIds(new Set());
  }, [chatId]);

  // 懒挂载：active_id 每次变化（含刷新后恢复）都挂载当前激活的 tool，
  // 其余已打开的 tool 等切换时才挂载。
  useEffect(() => {
    if (!active_id) return;
    setMountedToolsIds((draft) => {
      draft.add(active_id);
    });
  }, [active_id]);

  // active 只改 DB 状态（激活 + 历史），挂载由上面的 effect 驱动
  const active = useCallback(
    (instanceId: string) => {
      const current = chatToolsBarStateColl.get(chatId);
      if (current && current.active_id !== instanceId) {
        chatToolsBarStateColl.update(chatId, (it) => {
          it.active_id = instanceId;
          it.actived_history = moveToEnd(it.actived_history, instanceId);
        });
      }
    },
    [chatId],
  );

  const availableToolInstances = useMemo(
    () => chatToolInstances.filter(({ kind }) => hasToolKind(kind)),
    [chatToolInstances],
  );
  const availableToolInstancesMap = useMemo(
    () => keyBy(availableToolInstances, "id"),
    [availableToolInstances],
  );

  const tools = useMemo(
    () =>
      Array.from(tool_order ?? [])
        .map((it) => availableToolInstancesMap[it])
        .filter(Boolean),
    [tool_order, availableToolInstancesMap],
  );

  const mountedTools = useMemo(
    () => tools.filter(({ id }) => mountedToolsIds.has(id)),
    [tools, mountedToolsIds],
  );

  const openByToolId = useCallback(
    (toolId: string) => {
      // 成员判断走权威的 tool_order，而不是挂载集
      const bar = chatToolsBarStateColl.get(chatId);
      if (bar?.tool_order?.includes(toolId)) {
        active(toolId);
        return;
      }

      const instance = toolDataColl.get(toolId);
      if (!instance) return;

      const instanceId = instance.id;
      const chatToolInstance = ChatToolInstanceSchema.parse(instance);

      chatToolInstanceColl.insert({
        ...chatToolInstance,
        created_at: new Date(),
      });

      const chatToolsBarState = chatToolsBarStateColl.get(chatId);
      if (!chatToolsBarState) return;
      chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
        draft.tool_order.push(instanceId);
      });
      active(instanceId);
    },
    [chatId],
  );

  const openByRefId = useCallback(
    async ({
      kind,
      title,
      refId,
    }: {
      kind: string;
      title?: string;
      refId: string;
    }) => {
      onOpenBefore?.(kind, title);
      // 成员判断：ref 命中且已在 tool_order 里才算"已在栏内"
      const bar = chatToolsBarStateColl.get(chatId);
      const inBar = chatToolInstances.find(
        (it) => it.ref_id === refId && bar?.tool_order?.includes(it.id),
      );

      if (inBar) {
        active(inBar.id);
        return;
      }

      const inDbInstance = await queryOnce((q) =>
        q
          .from({ tool: toolDataColl })
          .where(({ tool }) =>
            and(
              eq(tool.kind, kind),
              eq(tool.ref_id, refId),
              eq(tool.chat_id, chatId),
            ),
          )
          .findOne(),
      );

      if (inDbInstance) {
        const toolInstance = ChatToolInstanceSchema.parse(inDbInstance);
        chatToolInstanceColl.insert({
          ...toolInstance,
          created_at: new Date(),
        });

        const chatToolsBarState = chatToolsBarStateColl.get(chatId);

        if (!chatToolsBarState) return;
        chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
          draft.tool_order.push(inDbInstance.id);
        });

        active(inDbInstance.id);
        return;
      }
      open(kind, title, refId);
    },
    [onOpenBefore, chatId, chatToolInstances],
  );

  const open = useCallback(
    async (kind: string, title?: string, refId?: string) => {
      onOpenBefore?.(kind, title);

      const now = new Date();
      const realTitle = title ?? kind;
      const instanceId = genId();
      chatToolInstanceColl.insert({
        id: instanceId,
        chat_id: chatId,
        kind,
        title: realTitle,
        ref_id: refId,
        data: "",
        created_at: now,
        updated_at: now,
      });
      toolDataColl.insert({
        id: instanceId,
        chat_id: chatId,
        kind: kind,
        ref_id: refId,
        data: "",
        title: realTitle,
        created_at: now,
        updated_at: now,
      });

      const chatToolsBarState = chatToolsBarStateColl.get(chatId);
      if (chatToolsBarState) {
        chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
          draft.tool_order.push(instanceId);
        });
      }
      active(instanceId);
    },
    [chatId, onOpenBefore],
  );
  useRxEvent("active:tool", true, ({ toolId }) => {
    active(toolId);
  });

  useRxEvent("open:tool:by-ref-id", true, ({ kind, title, refId }) => {
    openByRefId({ kind, title, refId });
  });

  useRxEvent("open:tool:by-tool-id", true, ({ toolId }) => {
    openByToolId(toolId);
  });

  const close = async (instanceId: string) => {
    chatToolInstanceColl.delete(instanceId);

    setMountedToolsIds((it) => {
      it.delete(instanceId);
    });

    const chatToolsBarState = chatToolsBarStateColl.get(chatId);
    if (chatToolsBarState?.active_id === instanceId) {
      const prevActivedId = actived_history?.at(-2);
      if (prevActivedId) {
        active(prevActivedId);
      } else {
        chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
          draft.active_id = undefined;
        });
      }
    }

    if (chatToolsBarState) {
      chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
        draft.tool_order = without(draft.tool_order, instanceId);
        draft.actived_history = without(draft.actived_history, instanceId);
      });
    }
  };

  const reorder = (orderedIds: string[]) => {
    const current = chatToolsBarStateColl.get(chatId);
    if (current) {
      chatToolsBarStateColl.update(chatId, (it) => {
        it.tool_order = orderedIds;
      });
    }
  };

  const hasTools = tools.length > 0;

  const result = {
    tools,
    chatToolInstancesMap,
    toolsMap: availableToolInstancesMap,
    hasTools,
    open,
    close,
    reorder,
    active,
    activeId: active_id,
    mountedTools,
  };

  return result;
};
