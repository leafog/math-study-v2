import { useCallback, useEffect } from "react";
import { eq, queryOnce, useLiveQuery } from "@tanstack/react-db";
import {
  chatToolInstanceColl,
  chatToolsBarStateColl,
} from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { useImmer } from "use-immer";
import { hasToolKind } from "~/components/chat/tools";
import { keyBy, without } from "lodash-es";
import { moveToEnd } from "~/lib/coll-utils";

export const useChatToolsManager = (
  chatId: string,
  onOpenBefore?: (kind: string, title?: string) => void,
) => {
  const { data: chatToolInstances = [] } = useLiveQuery(
    (q) =>
      q
        .from({ chatToolInstanceColl })
        .where(({ chatToolInstanceColl }) =>
          eq(chatToolInstanceColl.conversation_id, chatId),
        ),
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
  const availableToolInstances = chatToolInstances.filter(({ kind }) =>
    hasToolKind(kind),
  );
  const availableToolInstancesMap = keyBy(availableToolInstances, "id");

  const tools = Array.from(tool_order ?? []).map(
    (it) => availableToolInstancesMap[it],
  );
  const mountedTools = tools.filter(({ id }) => mountedToolsIds.has(id));

  const open = useCallback(
    async (kind: string, title?: string) => {
      onOpenBefore?.(kind, title);
      const instanceId = genId();
      chatToolInstanceColl.insert({
        id: instanceId,
        conversation_id: chatId,
        kind,
        title: title ?? kind,
        data: "",
        created_at: new Date(),
        updated_at: new Date(),
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
