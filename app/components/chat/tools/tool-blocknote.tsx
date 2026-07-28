import { Notebook } from "lucide-react";
import type { ToolDefinition, ToolPanelProps } from "./types";
import {
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core/extensions";

import { BlockNoteView } from "@blocknote/shadcn";

import { useTranslation } from "react-i18next";
import * as locales from "@blocknote/core/locales";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";
import { and, eq, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";
import { getCustomSlashMenuItems, schema } from "./create-math";
import type { MathfieldElement } from "mathlive";

const Panel = ({ chatId, kind, id }: ToolPanelProps) => {
  const mfRef = useRef<MathfieldElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);

  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const dictionary = useMemo(
    () => (locales as Record<string, any>)[lang],
    [lang],
  );
  const { theme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
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
        const blocks = editor.tryParseHTMLToBlocks(result?.data ?? "");
        editor.replaceBlocks(editor.document, blocks);
      }
    };
    load();
  }, [chatId, id, editor]);

  useEditorChange(async (editor) => {
    const html = editor.blocksToFullHTML(editor.document);
    toolDataColl.update(id, (draft) => {
      draft.data = html;
      draft.updated_at = new Date();
    });
  }, editor);

  useEffect(() => {
    const container = keyboardRef.current;
    if (!container) return;
    window.mathVirtualKeyboard.container = container;
    window.mathVirtualKeyboard.visible = false;
  }, []);
  return (
    <div
      className=" grid  grid-cols-1 content-between flex-1 min-h-0"
      ref={keyboardRef}
    >
      <BlockNoteView
        className="grow min-h-0 overflow-auto scrollbar-thin w-full"
        lang={i18n.language}
        theme={theme === "dark" ? "dark" : "light"}
        editor={editor}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query: string) => {
            return filterSuggestionItems(
              getCustomSlashMenuItems(editor),
              query,
            );
          }}
        />
      </BlockNoteView>
    </div>
  );
};

const exclidrawTool: ToolDefinition = {
  kind: "blocknote",
  Icon: Notebook,
  Panel,
};

export default exclidrawTool;
