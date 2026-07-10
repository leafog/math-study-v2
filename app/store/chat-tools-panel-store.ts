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
  restoreChatPercentage: string;
  restoreToolsPercentage: string;
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
      toolsClosed: true,
      chatClosed: false,
      toolsZenMod: false,
      restoreChatPercentage: "50%",
      restoreToolsPercentage: "50%",
    },
    (set) => ({
      onToolsResize: (size) =>
        set(({ restoreToolsPercentage }) => ({
          toolsSize: size,
          toolsClosed: size.inPixels === 0,
          restoreToolsPercentage:
            size.asPercentage === 0 || size.asPercentage === 100
              ? restoreToolsPercentage
              : `${size.asPercentage}%`,
        })),
      onChatResize: (size) =>
        set(({ restoreChatPercentage }) => {
          return {
            chatSize: size,
            chatClosed: size.inPixels === 0,
            restoreChatPercentage:
              size.asPercentage === 0 || size.asPercentage === 100
                ? restoreChatPercentage
                : `${size.asPercentage}%`,
          };
        }),
      toolsZenModTrigger: () => {
        set(({ toolsZenMod }) => ({
          toolsZenMod: !toolsZenMod,
        }));
      },
    }),
  ),
);
export const useChatToolsPanelStore = createSelectors(
  useChatToolsPanelStoreBase,
);
