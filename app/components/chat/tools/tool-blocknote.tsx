import { Notebook } from "lucide-react";
import type { ToolDefinition, ToolPanelProps } from "./types";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";

// Or, you can use ariakit, shadcn, etc.
import { BlockNoteView } from "@blocknote/mantine";
// Default styles for the mantine editor
import "@blocknote/mantine/style.css";
// Include the included Inter font
import "@blocknote/core/fonts/inter.css";
import { useTranslation } from "react-i18next";

import * as locales from "@blocknote/core/locales";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { and, eq, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";

const Panel = ({ chatId, kind, id }: ToolPanelProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const dictionary = (locales as Record<string, any>)[lang];
  const { theme } = useTheme();
  const editor = useCreateBlockNote({
    dictionary,
  });

  useEffect(() => {
    const load = async () => {
      const result = await queryOnce((q) => {
        return q
          .from({ toolDataColl })
          .where(({ toolDataColl }) =>
            and(eq(toolDataColl.id, id), eq(toolDataColl.chat_id, chatId)),
          )
          .findOne();
      });
      if (result?.data) {
        const blocks = await editor.tryParseHTMLToBlocks(result?.data ?? "");
        editor.replaceBlocks(editor.document, blocks);
      }
    };
    load();
  }, [chatId, id, editor]);

  useEditorChange(async (editor) => {
    const html = await editor.blocksToFullHTML(editor.document);
    toolDataColl.update(id, (draft) => {
      draft.data = html;
      draft.updated_at = new Date();
    });
  }, editor);

  return (
    <BlockNoteView
      onChange={async (editor) => {
        const a = editor.document;
        console.log(a);
      }}
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
