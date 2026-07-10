import type { PanelSize } from "react-resizable-panels";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import { createSelectors } from "./create-selectors";

type ChatToolsPanelState = {
  toolsSize: PanelSize;
  chatSize: PanelSize;
  restoreChatPercentage: string;
  restoreToolsPercentage: string;
  zenMode: boolean;
  toolsShow: boolean;
};
type ChatToolsPanelAction = {
  onToolsResize: (size: PanelSize) => void;
  onChatResize: (size: PanelSize) => void;
  zenModeToggle: VoidFunction;
  toolsShowToggle: VoidFunction;
};
type ChatToolsPanelStore = ChatToolsPanelState & ChatToolsPanelAction;

const useChatToolsPanelStoreBase = create<ChatToolsPanelStore>(
  combine<ChatToolsPanelState, ChatToolsPanelAction>(
    {
      toolsSize: { asPercentage: 0, inPixels: 0 },
      chatSize: { asPercentage: 0, inPixels: 0 },
      restoreChatPercentage: "50%",
      restoreToolsPercentage: "50%",
      zenMode: false,
      toolsShow: false,
    },
    (set) => ({
      onToolsResize: (size) =>
        set(({ restoreToolsPercentage }) => ({
          toolsSize: size,
          restoreToolsPercentage:
            size.asPercentage === 0 || size.asPercentage === 100
              ? restoreToolsPercentage
              : `${size.asPercentage}%`,
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
    }),
  ),
);
export const useChatToolsPanelStore = createSelectors(
  useChatToolsPanelStoreBase,
);
