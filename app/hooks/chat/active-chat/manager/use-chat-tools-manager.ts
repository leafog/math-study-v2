import { useCallback, useEffect, useMemo } from "react";
import { eq, useLiveQuery } from "@tanstack/react-db";
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

export const useChatToolsManager = (
  chatId: string,
  onOpenBefore?: (kind: string, title?: string) => void,
) => {
  const { data: chatToolInstances = [] } = useLiveQuery(
    {
      query: (q) =>
        q
          .from({ chatToolInstanceColl })
          .where(({ chatToolInstanceColl }) =>
            eq(chatToolInstanceColl.chat_id, chatId),
          ),
    },
    [chatId],
  );

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

  const { active_id, tool_order, actived_history } = chatToolsBarState ?? {};
  const [mountedToolsIds, setMountedToolsIds] = useImmer(new Set());

  useEffect(() => {
    setMountedToolsIds((it) => {
      if (active_id) it.add(active_id);
    });
  }, [active_id]);

  const active = useCallback(
    async (instanceId: string) => {
      const current = chatToolsBarStateColl.get(chatId);
      if (current) {
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
      Array.from(tool_order ?? []).map((it) => availableToolInstancesMap[it]),
    [tool_order, availableToolInstancesMap],
  );

  const mountedTools = useMemo(
    () => tools.filter(({ id }) => mountedToolsIds.has(id)),
    [tools, mountedToolsIds],
  );

  const open = useCallback(
    async (kind: string, title?: string, refId?: string) => {
      onOpenBefore?.(kind, title);
      const instanceId = genId();
      const now = new Date();
      chatToolInstanceColl.insert({
        id: instanceId,
        chat_id: chatId,
        kind,
        title: title ?? kind,
        ref_id: refId,
        data: "",
        created_at: now,
        updated_at: now,
      });
      toolDataColl.insert({
        id: instanceId,
        chat_id: chatId,
        kind: kind,
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

  useEvent("open:tool", ({ kind, title, refId }) => {
    // @TODO 打开了 聚焦
    const instance = chatToolInstances.find(
      (it) => it.kind === kind && it.ref_id === refId,
    );
    if (instance) {
      active(instance.id);
    } else {
      open(kind, title, refId);
    }
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
