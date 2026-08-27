import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Excalidraw,
  exportToBlob,
  Footer,
  MainMenu,
  serializeAsJSON,
  getCommonBounds,
  hashElementsVersion,
  sceneCoordsToViewportCoords,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useMouse } from "@uidotdev/usehooks";

import type {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  Zoom,
} from "@excalidraw/excalidraw/types";
import type { ToolPanelProps } from "./types";
import { ToolContainer } from "./tool-container";
import { useTheme } from "next-themes";
import { eq, and, queryOnce } from "@tanstack/react-db";
import { toolDataColl } from "~/db/tdb-collections";
import { useBoolean, useDebounceCallback } from "usehooks-ts";
import { Button } from "~/components/ui/button";
import { MessageCirclePlus } from "lucide-react";
import extractTextFromImage from "~/lib/file/extract-text-from-image";

import AnnoMarker from "./anno-marker";
import { useImmer } from "use-immer";

type AnnoIng = {
  selectedElementIds: {
    [id: string]: true;
  };
  text: string;
};

type Box = {
  left: number;
  top: number;
  w: number;
  h: number;
};

type Annoed = {
  box: Box;
};

const ExclidrawPanel = ({ chatId, id }: ToolPanelProps) => {
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);
  const { resolvedTheme } = useTheme();
  const [initialData, setInitialData] = useState();
  const [selectedIds, setSelectedIds] = useState<{
    [id: string]: true;
  }>({});

  const { value: isSelecting, setValue: setSelecting } = useBoolean(false);
  // 正在注释：点工具栏按钮开启/关闭
  const { value: isAnnotating, toggle: toggleAnnotating } = useBoolean(false);
  const [mouse, exclidrawDivRef] = useMouse<HTMLDivElement>();
  const {
    value: annoIng,
    setTrue: startAnnoIng,
    setFalse: closeAnnoing,
  } = useBoolean(false);
  const [currAnno, setCurrAnno] = useState<AnnoIng>();
  const [annos, setAnnos] = useImmer<AnnoIng[]>([]);

  const [scrollX, setScrollX] = useState<number>(0);
  const [scrollY, setScrollY] = useState<number>(0);
  const [zoom, setZoom] = useState<Zoom["value"]>(1 as Zoom["value"]);
  // 场景版本号(元素 versionNonce 的哈希)，元素移动/变化时更新，驱动标注框重算
  const [sceneVersion, setSceneVersion] = useState<number>(0);

  const submitCurrAnno = useCallback(() => {
    if (currAnno) {
      setAnnos((draft) => {
        draft.push(currAnno);
      });
    }
  }, [currAnno]);

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
    const text = await extractTextFromImage(blob);
  }, []);
  const excalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    apiRef.current = api;
  }, []);

  useEffect(() => {
    setCurrAnno({
      selectedElementIds: selectedIds,
      text: "",
    });
  }, [selectedIds]);

  const toAnnoViewPortPos = useCallback(
    (annoItem?: AnnoIng) => {
      if (!isAnnotating) return;
      if (!annoItem) return;
      const api = apiRef.current;
      if (!api) return;
      const elements = api.getSceneElements();
      const selectedElements = elements.filter(
        (it) => annoItem.selectedElementIds[it.id],
      );
      if (selectedElements.length === 0) return;
      const [minX, minY, maxX, maxY] = getCommonBounds(selectedElements);

      const iconPos = sceneCoordsToViewportCoords(
        { sceneX: minX, sceneY: minY },
        {
          scrollX,
          scrollY,
          zoom: { value: zoom },
          offsetLeft: 0,
          offsetTop: -40,
        },
      );
      const box = {
        left: iconPos.x,
        top: iconPos.y + 40,
        w: (maxX - minX) * zoom,
        h: (maxY - minY) * zoom,
      };
      return {
        iconPos,
        box,
      };
    },
    [scrollX, scrollY, zoom, isAnnotating, sceneVersion],
  );

  const currAnnoViewPortPos = useMemo(() => {
    return toAnnoViewPortPos(currAnno);
  }, [toAnnoViewPortPos, currAnno]);

  const [a] = useState<{}[]>();
  return (
    <ToolContainer className="size-full grid grid-rows-[auto_1fr]">
      <div className="h-12 flex items-center justify-between px-4">
        <div>{annos.length}</div>
        <div>
          <Button
            variant={"ghost"}
            size="icon-lg"
            onClick={toggleAnnotating}
            data-active={isAnnotating}
          >
            <MessageCirclePlus className={isAnnotating ? "text-primary" : ""} />
          </Button>
        </div>
      </div>
      <div ref={exclidrawDivRef} className="relative overflow-hidden">
        <Excalidraw
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          onChange={(elements, appState, files) => {
            onChange(elements, appState, files);
            setSelecting(!!appState.selectionElement);
            setScrollX(appState.scrollX);
            setScrollY(appState.scrollY);
            setZoom(appState.zoom.value);
            setSelecting(!!appState.selectionElement);
            setSelectedIds(appState.selectedElementIds);
            setSceneVersion(hashElementsVersion(elements));
          }}
          initialData={initialData}
          gridModeEnabled
          excalidrawAPI={excalidrawAPI}
        >
          <MainMenu>
            <MainMenu.Item
              onClick={(e) => {
                alert(e);
              }}
            >
              12
            </MainMenu.Item>
          </MainMenu>
          <Footer>
            <Button>sd</Button>
          </Footer>
        </Excalidraw>

        {isAnnotating && currAnno && !isSelecting && currAnnoViewPortPos && (
          <AnnoMarker
            pos={currAnnoViewPortPos}
            value={currAnno.text}
            onChange={(v) =>
              setCurrAnno((prev) => (prev ? { ...prev, text: v } : prev))
            }
            onSubmit={submitCurrAnno}
          />
        )}

        {/* 已提交标注列表 */}
        {annos.map((anno, i) => {
          const pos = toAnnoViewPortPos(anno);
          if (!pos) return null;
          return (
            <AnnoMarker
              key={i}
              pos={pos}
              value={anno.text}
              onChange={(v) =>
                setAnnos((draft) => {
                  draft[i].text = v;
                })
              }
              onSubmit={() => {}}
              initialReadOnly
            />
          );
        })}
      </div>
    </ToolContainer>
  );
};

export default ExclidrawPanel;
