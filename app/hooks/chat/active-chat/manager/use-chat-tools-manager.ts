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
          eq(chatToolInstanceColl.conversationId, chatId),
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

  const { activeId, toolOrder, activedHistory } = chatToolsBarState ?? {};
  const [mountedToolsIds, setMountedToolsIds] = useImmer(new Set());

  useEffect(() => {
    setMountedToolsIds((it) => {
      if (activeId) it.add(activeId);
    });
  }, [activeId]);

  const active = useCallback(
    async (instanceId: string) => {
      const current = chatToolsBarStateColl.get(chatId);
      if (current) {
        chatToolsBarStateColl.update(chatId, (it) => {
          it.activeId = instanceId;
          it.activedHistory = moveToEnd(it.activedHistory, instanceId);
        });
      }
    },
    [chatId],
  );
  const availableToolInstances = chatToolInstances.filter(({ kind }) =>
    hasToolKind(kind),
  );
  const availableToolInstancesMap = keyBy(availableToolInstances, "id");

  const tools = Array.from(toolOrder ?? []).map(
    (it) => availableToolInstancesMap[it],
  );
  const mountedTools = tools.filter(({ id }) => mountedToolsIds.has(id));

  const open = useCallback(
    async (kind: string, title?: string) => {
      onOpenBefore?.(kind, title);
      const instanceId = genId();
      chatToolInstanceColl.insert({
        id: instanceId,
        conversationId: chatId,
        kind,
        title: title ?? kind,
        data: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const chatToolsBarState = chatToolsBarStateColl.get(chatId);
      if (chatToolsBarState) {
        chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
          draft.toolOrder.push(instanceId);
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
    if (chatToolsBarState?.activeId === instanceId) {
      const prevActivedId = activedHistory?.at(-2);
      if (prevActivedId) {
        active(prevActivedId);
      }
    }

    if (chatToolsBarState) {
      chatToolsBarStateColl.update(chatToolsBarState.id, (draft) => {
        draft.toolOrder = without(draft.toolOrder, instanceId);
        draft.activedHistory = without(draft.activedHistory, instanceId);
      });
    }
  };

  const reorder = (orderedIds: string[]) => {
    const current = chatToolsBarStateColl.get(chatId);
    if (current) {
      chatToolsBarStateColl.update(chatId, (it) => {
        it.toolOrder = orderedIds;
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
    activeId,
    mountedTools,
  };

  return result;
};
