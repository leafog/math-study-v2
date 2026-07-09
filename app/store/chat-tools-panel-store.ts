import type { PanelSize } from "react-resizable-panels";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { createSelectors } from "./create-selectors";

type ChatToolsPanelState = {
  toolsSize: PanelSize;
  toolsClosed: boolean;
  chatSize: PanelSize;
  chatClosed: boolean;
  toolsZenMod: boolean;
  zenLastChatSize: PanelSize;
};
type ChatToolsPanelAction = {
  onToolsResize: (size: PanelSize) => void;
  onChatResize: (size: PanelSize) => void;
  toolsZenModTrigger: VoidFunction;
};
type ChatToolsPanelStore = ChatToolsPanelState & ChatToolsPanelAction;

const useChatToolsPanelStoreBase = create<ChatToolsPanelStore>(
  combine(
    {
      toolsSize: { asPercentage: 0, inPixels: 0 },
      chatSize: { asPercentage: 0, inPixels: 0 },
      toolsClosed: false,
      chatClosed: false,
      toolsZenMod: false,
      zenLastChatSize: { asPercentage: 0, inPixels: 0 },
    },
    (set) => ({
      onToolsResize: (size) =>
        set({
          toolsSize: size,
          toolsClosed: size.inPixels === 0,
        }),
      onChatResize: (size) =>
        set(({ toolsZenMod }) => {
          return {
            chatSize: size,
            chatClosed: size.inPixels === 0,
          };
        }),
      toolsZenModTrigger: () => {
        set(({ toolsZenMod, chatSize }) => {
          if (toolsZenMod) {
            return {
              toolsZenMod: false,
            };
          } else {
            return {
              toolsZenMod: true,
              zenLastChatSize: chatSize,
            };
          }
        });
      },
    }),
  ),
);
export const useChatToolsPanelStore = createSelectors(
  useChatToolsPanelStoreBase,
);
