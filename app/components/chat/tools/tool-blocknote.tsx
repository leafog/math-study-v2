import { Notebook } from "lucide-react";
import type { ToolDefinition, ToolPanelProps } from "./types";
import {
  SuggestionMenuController,
  useCreateBlockNote,
  useEditorChange,
  useEditorSelectionChange,
} from "@blocknote/react";

import { filterSuggestionItems } from "@blocknote/core/extensions";

import { BlockNoteView } from "@blocknote/shadcn";

import { useTranslation } from "react-i18next";
import * as locales from "@blocknote/core/locales";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { and, eq, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";
import {
  getCustomSlashMenuItems,
  getMathSlashMenuItems,
  getSelectedTextWithMath,
  mathFieldExtension,
  schema,
} from "./create-math";
import { useToolSelectionStore } from "./store/tool-selection";

const Panel = ({ chatId, kind, id }: ToolPanelProps) => {
  const keyboardRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  const dictionary = useMemo(
    () => (locales as Record<string, any>)[lang],
    [lang],
  );
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
    dictionary,
    extensions: [mathFieldExtension],
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
        const document = JSON.parse(result?.data ?? "");
        editor.replaceBlocks(editor.document, document);
      }
    };
    load();
  }, [chatId, id, editor]);

  const saveDocument = useDebounceCallback(async () => {
    const json = JSON.stringify(editor.document);
    toolDataColl.update(id, (draft) => {
      draft.data = json;
      draft.updated_at = new Date();
    });
  }, 500);

  useEditorChange(() => {
    saveDocument();
  }, editor);

  const setSelection = useToolSelectionStore.use.setSelection();
  const clearSelection = useToolSelectionStore.use.clearSelection();

  const handleSelectionStable = useDebounceCallback(() => {
    const content = getSelectedTextWithMath(editor);
    const blocks = editor.getSelection()?.blocks ?? [];
    const markdown = editor.blocksToMarkdownLossy(blocks);
    if (content.length > 0) {
      setSelection({ id, kind, type: "markdown", content: markdown });
    }
  }, 300);

  useEditorSelectionChange(() => {
    handleSelectionStable();
  }, editor);

  useEffect(() => {
    const container = keyboardRef.current;
    if (!container) return;
    window.mathVirtualKeyboard.container = container;
    window.mathVirtualKeyboard.visible = false;
  }, []);

  return (
    <div
      className=" grid  grid-cols-1 content-between flex-1 min-h-0 bg-red"
      ref={keyboardRef}
    >
      <BlockNoteView
        className="grow min-h-0 overflow-auto scrollbar-thin w-full"
        lang={i18n.language}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        editor={editor}

        portalElements={{ default: document.body }}
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
        <SuggestionMenuController
          triggerCharacter={"$"}
          getItems={async (query: string) => {
            return filterSuggestionItems(getMathSlashMenuItems(editor), query);
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
