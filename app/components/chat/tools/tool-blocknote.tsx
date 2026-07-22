import { Notebook } from "lucide-react";
import type { ToolDefinition, ToolPanelProps } from "./types";
import { useCreateBlockNote } from "@blocknote/react";
import { markdownToBlocks } from "@blocknote/core";

// Or, you can use ariakit, shadcn, etc.
import { BlockNoteView } from "@blocknote/mantine";
// Default styles for the mantine editor
import "@blocknote/mantine/style.css";
// Include the included Inter font
import "@blocknote/core/fonts/inter.css";
import { useTranslation } from "react-i18next";

import * as locales from "@blocknote/core/locales";
import { useTheme } from "next-themes";

const Panel = ({}: ToolPanelProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const dictionary = (locales as Record<string, any>)[lang];
  const { theme } = useTheme();
  const editor = useCreateBlockNote({
    dictionary,
  });

  return (
    <BlockNoteView
      onChange={async () => {}}
      className="flex-1 min-h-0 overflow-auto scrollbar-thin"
      lang={i18n.language}
      editor={editor}
      theme={theme === "dark" ? "dark" : "light"}
    />
  );
};

const exclidrawTool: ToolDefinition = {
  kind: "blocknote",
  Icon: Notebook,
  Panel,
};

export default exclidrawTool;
