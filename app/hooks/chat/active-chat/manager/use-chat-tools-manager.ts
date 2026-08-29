import { act, useCallback, useEffect, useMemo } from "react";
import { and, eq, inArray, queryOnce, useLiveQuery } from "@tanstack/react-db";
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
import { useEvent } from "~/event/use-event";
import {
  ChatToolInstanceSchema,
  type ChatToolInstance,
} from "~/db/db-zod-schema";

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
  const [mountedToolsIds, setMountedToolsIds] = useImmer(new Set());

  const active = useCallback(
    async (instanceId: string) => {
      const current = chatToolsBarStateColl.get(chatId);
      setMountedToolsIds((draft) => {
        draft.add(instanceId);
      });
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
      const inBarInstance = mountedToolsIds.has(toolId);
      if (inBarInstance) {
        active(toolId);
        return;
      }

      const instance = toolDataColl.get(toolId);
      console.log(toolId);
      console.log(instance);
      if (!instance) return;

      const instanceId = instance.id;
      const chatToolInstance = ChatToolInstanceSchema.parse(instance);

      console.log(instance);

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
    [chatId, mountedToolsIds],
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
      const inBar = chatToolInstances.find((it) => it.ref_id === refId);

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
    [onOpenBefore, chatId],
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
  useEvent("active:tool", ({ toolId }) => {
    active(toolId);
  });

  useEvent("open:tool:by-ref-id", ({ kind, title, refId }) => {
    openByRefId({ kind, title, refId });
  });

  useEvent("open:tool:by-tool-id", ({ toolId }) => {
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
