import { useCallback, useEffect } from "react";
import { eq, useLiveQuery, useLiveSuspenseQuery } from "@tanstack/react-db";
import {
  chatToolInstancesColl,
  chatToolsBarStateColl,
} from "~/db/tdb-collections";
import { genId } from "~/lib/id-utils";
import { useImmer } from "use-immer";
import { hasToolKind } from "~/components/chat/tools";
import { usePrevious } from "@uidotdev/usehooks";

export const useChatToolsManager = (chatId: string) => {
  const { data: chatToolInstances = [] } = useLiveQuery(
    (q) =>
      q
        .from({ chatToolInstancesColl })
        .where(({ chatToolInstancesColl }) =>
          eq(chatToolInstancesColl.conversationId, chatId),
        ),
    [chatId],
  );

  const { data: chatToolsPanelActive } = useLiveQuery(
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
  const activeId = chatToolsPanelActive?.activeToolId;
  const toolOrder = chatToolsPanelActive?.toolOrder;
  const prevActiveId = usePrevious(activeId);

  const [mountedToolsIds, setMountedToolsIds] = useImmer(new Set());

  useEffect(() => {
    setMountedToolsIds((it) => {
      if (activeId) it.add(activeId);
    });
  }, [activeId]);

  const active = useCallback(
    async (instanceId: string) => {
      const current = chatToolsBarStateColl.get(chatId);
      if (current === undefined) {
        chatToolsBarStateColl.insert({
          id: chatId,
          activeToolId: instanceId,
        });
      } else {
        chatToolsBarStateColl.update(chatId, (it) => {
          it.activeToolId = instanceId;
        });
      }
    },
    [chatId],
  );

  const tools = chatToolInstances
    .filter(({ kind }) => hasToolKind(kind))
    .sort((a, b) => {
      if (!toolOrder) return 0;
      const ia = toolOrder.indexOf(a.id);
      const ib = toolOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

  const mountedTools = tools.filter(({ id }) => mountedToolsIds.has(id));

  const open = useCallback(
    async (kind: string, title?: string) => {
      const InstanceId = genId();
      chatToolInstancesColl.insert({
        id: InstanceId,
        conversationId: chatId,
        kind,
        title: title ?? kind,
        data: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      active(InstanceId);
    },
    [chatId],
  );

  const close = useCallback(
    async (instanceId: string) => {
      chatToolInstancesColl.delete(instanceId);
      setMountedToolsIds((it) => {
        it.delete(instanceId);
      });
    },
    [setMountedToolsIds, prevActiveId, tools],
  );

  const reorder = useCallback(
    (orderedIds: string[]) => {
      console.log(orderedIds + "-----");
      const current = chatToolsBarStateColl.get(chatId);
      if (current === undefined) {
        chatToolsBarStateColl.insert({
          id: chatId,
          activeToolId: activeId ?? "",
          toolOrder: orderedIds,
        });
      } else {
        chatToolsBarStateColl.update(chatId, (it) => {
          it.toolOrder = orderedIds;
        });
      }
    },
    [chatId, activeId],
  );

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
