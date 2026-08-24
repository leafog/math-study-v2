import { useCallback, useEffect, useRef, useState } from "react";
import {
  Excalidraw,
  exportToBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { ToolPanelProps } from "./types";
import { ToolContainer } from "./tool-container";
import { useTheme } from "next-themes";
import { eq, and, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "~/components/ui/button";
import { Download } from "lucide-react";
import extractImage from "~/lib/file/extract-image";
import extractText from "~/lib/file/extract-text";

const ExclidrawPanel = ({ chatId, id }: ToolPanelProps) => {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);
  const { resolvedTheme } = useTheme();
  const [initialData, setInitialData] = useState();

  useEffect(() => {
    const load = async () => {
      const result = await queryOnce((q) =>
        q
          .from({ toolDataColl })
          .where(({ toolDataColl }) =>
            and(eq(toolDataColl.id, id), eq(toolDataColl.chat_id, chatId)),
          )
          .findOne(),
      );
      if (result?.data) {
        const nd = JSON.parse(result.data);
        setInitialData({ ...nd });
      }
    };
    load();
  }, [chatId, id]);

  // 保存场景到 DB,500ms 防抖;只写库不 setState,不会触发渲染环
  const onSyncToDb: ExcalidrawProps["onChange"] = async (e, app, f) => {
    const data = serializeAsJSON(e, app, f, "database");
    const existing = toolDataColl.get(id);
    if (existing) {
      toolDataColl.update(existing.id, (it) => {
        it.data = data;
      });
    }
  };

  const onChange = useDebounceCallback(onSyncToDb, 500);

  // 导出选中的元素为 PNG blob 并下载。
  // 点击时实时读 appState.selectedElementIds(record),无需额外维护选中 state。
  const exportSelected = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    const appState = api.getAppState();
    const selectedIds = Object.keys(appState.selectedElementIds);
    if (selectedIds.length === 0) return;

    const elements = api
      .getSceneElements()
      .filter((it) => appState.selectedElementIds[it.id]);
    if (elements.length === 0) return;

    const blob = await exportToBlob({
      elements,
      appState,
      files: api.getFiles(),
      mimeType: "image/png",
      exportPadding: 10,
    });
    const text = await extractImage(blob);
    console.log(text);
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement("a");
    // a.href = url;
    // a.download = `excalidraw-${selectedIds.length}.png`;
    // a.click();
    // URL.revokeObjectURL(url);
  }, []);

  const excalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
    api.getFiles();
  }, []);

  return (
    <ToolContainer className="size-full grid grid-rows-[auto_1fr]">
      <div className="flex items-center gap-2 bg-muted h-10 px-2">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={exportSelected}
        >
          <Download className="h-4 w-4" />
          导出选中
        </Button>
      </div>
      <Excalidraw
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        onChange={onChange}
        initialData={initialData}
        gridModeEnabled
        excalidrawAPI={excalidrawAPI}
      />
    </ToolContainer>
  );
};

export default ExclidrawPanel;
