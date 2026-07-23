import { useEffect, useRef, useState } from "react";
import {
  Excalidraw,
  serializeAsJSON,
  restoreElements,
  restoreAppState,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Pen } from "lucide-react";
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { ToolDefinition, ToolPanelProps } from "./types";
import { useTheme } from "next-themes";
import { eq, and, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";
import { useDebounceCallback } from "usehooks-ts";

const Panel = ({ chatId, id, kind }: ToolPanelProps) => {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);
  const { theme } = useTheme();
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

  const onChange: ExcalidrawProps["onChange"] = async (e, app, f) => {
    const data = serializeAsJSON(e, app, f, "database");
    const existing = toolDataColl.get(id);
    const now = new Date();
    if (existing) {
      toolDataColl.update(existing.id, (it) => {
        it.data = data;
      });
    }
  };
  const onChangeWithDelay = useDebounceCallback(onChange, 500);
  return (
    <div className="size-full">
      <Excalidraw
        theme={theme === "dark" ? "dark" : "light"}
        onChange={onChangeWithDelay}
        initialData={initialData}

        gridModeEnabled
        excalidrawAPI={(api) => {
          apiRef.current = api;
          api.getFiles();
        }}
      />
    </div>
  );
};

const exclidrawTool: ToolDefinition = {
  kind: "excalidraw",
  Icon: Pen,
  Panel,
};

export default exclidrawTool;
