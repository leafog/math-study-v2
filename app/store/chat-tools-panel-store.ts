import type { PanelSize } from "react-resizable-panels";
import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { createSelectors } from "./create-selectors";
import { tanstackDbStorage } from "./tanstack-db-storage";

type ChatToolsPanelState = {
  toolsSize: PanelSize;
  chatSize: PanelSize;
  restoreChatPercentage: string;
  restoreToolsPercentage: string;
  zenMode: boolean;
  toolsShow: boolean;
  menuShow: boolean;
};
type ChatToolsPanelAction = {
  onToolsResize: (size: PanelSize) => void;
  onChatResize: (size: PanelSize) => void;
  zenModeToggle: VoidFunction;
  toolsShowToggle: VoidFunction;
  menuShowToggle: VoidFunction;
  menuShowSet: (value: boolean) => void;
};

const chatToolsPanelStateDefault = {
  toolsSize: { asPercentage: 0, inPixels: 0 },
  chatSize: { asPercentage: 0, inPixels: 0 },
  restoreChatPercentage: "50%",
  restoreToolsPercentage: "50%",
  zenMode: false,
  toolsShow: false,
  menuShow: false,
};
const chatToolsPanelStoreCreator = (init: ChatToolsPanelState) =>
  combine<ChatToolsPanelState, ChatToolsPanelAction>(init, (set) => ({
    onToolsResize: (size) =>
      set(({ restoreToolsPercentage }) => ({
        toolsSize: size,
        restoreToolsPercentage:
          size.asPercentage === 0 || size.asPercentage === 100
            ? restoreToolsPercentage
            : `${size.asPercentage}%`,
        toolsShow: size.asPercentage > 0,
      })),
    onChatResize: (size) =>
      set(({ restoreChatPercentage, zenMode }) => {
        return {
          chatSize: size,
          restoreChatPercentage:
            size.asPercentage === 0 || size.asPercentage === 100
              ? restoreChatPercentage
              : `${size.asPercentage}%`,
          zenMode: size.asPercentage === 0 ? true : zenMode,
        };
      }),
    zenModeToggle: () =>
      set(({ zenMode }) => ({
        zenMode: !zenMode,
      })),
    toolsShowToggle: () =>
      set(({ toolsShow }) => ({
        toolsShow: !toolsShow,
      })),
    menuShowToggle: () =>
      set(({ menuShow }) => ({
        menuShow: !menuShow,
      })),
    menuShowSet: (value) => set({ menuShow: value }),
  }));

const newChatToolsPanelStoreName = "chat-tools-panel-store-new";
const newChatToolsPanelStore = createSelectors(
  create(
    persist(chatToolsPanelStoreCreator(chatToolsPanelStateDefault), {
      name: newChatToolsPanelStoreName,
      storage: createJSONStorage(() => sessionStorage),
    }),
  ),
);

export type ChatToolsPanelStore = typeof newChatToolsPanelStore;

const chatToolsPanelStoreCache = new Map<string, ChatToolsPanelStore>();

export const createChatToolsPanelStore = (
  isNewChat: boolean,
  chatId: string,
): ChatToolsPanelStore => {
  if (isNewChat) {
    return newChatToolsPanelStore;
  }
  console.log("next");
  let store = chatToolsPanelStoreCache.get(chatId);
  if (!store) {
    store = createSelectors(
      create(
        persist(chatToolsPanelStoreCreator(newChatToolsPanelStore.getState()), {
          name: `chat-tools-panel-store-${chatId}`,
          storage: createJSONStorage(() => tanstackDbStorage),
        }),
      ),
    );
    chatToolsPanelStoreCache.set(chatId, store);
  }
  return store;
};
