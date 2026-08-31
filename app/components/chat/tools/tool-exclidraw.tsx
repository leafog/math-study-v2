import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Excalidraw,
  serializeAsJSON,
  getCommonBounds,
  hashElementsVersion,
  sceneCoordsToViewportCoords,
  exportToSvg,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./excalidraw-theme.css";
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
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Eye, MessageCirclePlus, Trash, X } from "lucide-react";

import AnnoMarker from "./anno-marker";
import AnnoedMarker, { type AnnoedMarkerState } from "./annoed-marker";
import { useTranslation } from "react-i18next";
import { cn } from "~/lib/utils";
import { useChatPromptInput } from "~/hooks/chat/active-chat/hooks";
import { svgToXmlString } from "~/lib/xml-utils";
import { useRxEvent } from "~/event/events";

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

const ExclidrawPanel = ({ chatId, id }: ToolPanelProps) => {
  const { t } = useTranslation();
  const apiRef = useRef<ExcalidrawImperativeAPI>(null);
  const { resolvedTheme } = useTheme();
  const [initialData, setInitialData] = useState();
  const [selectedIds, setSelectedIds] = useState<{
    [id: string]: true;
  }>({});

  const { value: isSelecting, setValue: setSelecting } = useBoolean(false);

  const {
    value: isAnnotating,
    toggle: toggleAnnotating,
    setTrue: startAnnotating,
  } = useBoolean(false);

  const chatPromptInput = useChatPromptInput();
  const annos =
    chatPromptInput.use.annotationsByTool((byTool) => byTool[id]) ?? [];
  const addAnnotation = chatPromptInput.use.addAnnotation();
  const updateAnnotation = chatPromptInput.use.updateAnnotation();
  const removeAnnotation = chatPromptInput.use.removeAnnotation();
  const clearAnnotations = chatPromptInput.use.clearAnnotations();

  const {
    value: showAll,
    toggle: toggleShowAll,
    setFalse: closeShowAll,
  } = useBoolean(false);
  const [mouse, exclidrawDivRef] = useMouse<HTMLDivElement>();
  const {
    value: annoIng,
    setTrue: startAnnoIng,
    setFalse: closeAnnoing,
  } = useBoolean(false);
  const [currAnno, setCurrAnno] = useState<AnnoIng>();

  const [scrollX, setScrollX] = useState<number>(0);
  const [scrollY, setScrollY] = useState<number>(0);
  const [zoom, setZoom] = useState<Zoom["value"]>(1 as Zoom["value"]);

  const [sceneVersion, setSceneVersion] = useState<number>(0);
  // 每条标注的三态（受控）：仅记"正在编辑"的序号，展示/折叠由 showAll 派生
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  // api 就绪标志：场景真正初始化完(应用完 initialData)后才置 true。
  // 挂载(excalidrawAPI)早于场景初始化,此刻场景可能还是空的/未应用异步加载的 initialData。
  const [apiReady, setApiReady] = useState(false);
  // 记录 initialData 是否已从 DB 加载并交给 Excalidraw(onChange 里据此判断是否可置就绪)
  const initialDataLoadedRef = useRef(false);

  // 等挂载后消费：apiReady 才订阅（BehaviorSubject 会重放"未就绪期间发布的最近一次"）。
  // 聚焦即进入该条的编辑态，并把该条 scene 中心滚动到画布可见区中央。
  // viewport = (scene + scroll)*zoom + offset；中心对齐时 offset 抵消 => scroll = viewport/(2*zoom) - sceneCenter
  useRxEvent("focus-annotation", apiReady, (e) => {
    if (e.toolId !== id) return; // 只响应本工具实例
    const annoIdx = e.annoIdx;
    startAnnotating(); // 进入标注态：marker 才渲染
    setEditingIdx(annoIdx);
    const anno = annos[annoIdx];
    if (anno?.type !== "svg") return;
    const api = apiRef.current;
    if (!api) return;

    const centerOnAnno = () => {
      const { width, height, zoom } = api.getAppState();
      if (!width || !height) {
        requestAnimationFrame(centerOnAnno);
        return;
      }
      const z = zoom.value;
      const [minX, minY, maxX, maxY] = anno.bounds;
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      api.updateScene({
        appState: {
          scrollX: width / 2 / z - cx,
          scrollY: height / 2 / z - cy,
        },
        captureUpdate: "NEVER",
      });
    };
    requestAnimationFrame(centerOnAnno);
  });

  const exportSelected = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    const appState = api.getAppState();
    const selectedIds = Object.keys(appState.selectedElementIds);
    if (selectedIds.length === 0) return;

    const selectElement = api
      .getSceneElements()
      .filter((it) => appState.selectedElementIds[it.id]);

    if (selectElement.length === 0) return;
    const withBound = selectElement.flatMap((it) => [
      it.id,
      ...(it.boundElements?.map((it) => it.id) ?? []),
    ]);
    const withBoundSet = new Set(withBound);

    const elements = api
      .getSceneElements()
      .filter((it) => withBoundSet.has(it.id));

    const svg = await exportToSvg({
      elements,
      appState,
      files: api.getFiles(),
      exportPadding: 10,
    });

    return { svg };
  }, []);

  const submitCurrAnno = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;

    if (currAnno && currAnnoViewPortPos) {
      const info = await exportSelected();
      if (info) {
        const { svg } = info;
        if (!svg) return;
        const svgXmlStr = svgToXmlString(svg);

        const pad = 10;
        const [minX, minY, maxX, maxY] = currAnnoViewPortPos.bounds;
        addAnnotation(id, {
          type: "svg",
          bounds: [minX - pad, minY - pad, maxX + pad, maxY + pad],
          text: currAnno.text,
          svgXmlStr,
        });
        api.updateScene({
          appState: { selectedElementIds: {} },
          captureUpdate: "NEVER",
        });
      }
    }
  }, [currAnno, addAnnotation, id]);

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
        initialDataLoadedRef.current = true;
      } else {
        // 无存档:空场景即为就绪,无需等 onChange 应用 initialData
        setApiReady(true);
      }
    };
    load();
  }, [chatId, id]);

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

  const excalidrawAPI = useCallback((api: ExcalidrawImperativeAPI) => {
    // 只暂存 api；就绪等场景应用完 initialData 后的 onChange 再置位
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
      const { scrollX, scrollY, zoom } = api.getAppState();
      const z = zoom.value;
      const elements = api.getSceneElements();
      const selectedElements = elements.filter(
        (it) => annoItem.selectedElementIds[it.id],
      );
      if (selectedElements.length === 0) return;
      const bounds = getCommonBounds(selectedElements);
      const [minX, minY, maxX, maxY] = bounds;
      // 与提交后一致：box/iconPos 用含 padding 的 bounds 换算，提交前后标记无跳变。
      // icon 与 box 同源同定位，避免提交时 box 看起来下移
      const pad = 10;
      const pMinX = minX - pad;
      const pMinY = minY - pad;
      const pMaxX = maxX + pad;
      const pMaxY = maxY + pad;
      const iconPos = sceneCoordsToViewportCoords(
        { sceneX: pMinX, sceneY: pMinY },
        { scrollX, scrollY, zoom: { value: z }, offsetLeft: 0, offsetTop: -30 },
      );
      const box: Box = {
        left: iconPos.x,
        top: iconPos.y + 30,
        w: (pMaxX - pMinX) * z,
        h: (pMaxY - pMinY) * z,
      };
      return {
        iconPos,
        box,
        // 存储仍用原始 bounds，提交时统一 pad
        bounds,
      };
    },
    [scrollX, scrollY, zoom, isAnnotating, sceneVersion],
  );

  const currAnnoViewPortPos = useMemo(() => {
    return toAnnoViewPortPos(currAnno);
  }, [toAnnoViewPortPos, currAnno]);

  // 已提交标注：用定格的场景 bounds 换算视口位置，调用时从 appState 取实时 scroll/zoom
  const annoedToViewPortPos = useCallback(
    (anno?: { bounds: [number, number, number, number] }) => {
      if (!anno) return;
      const api = apiRef.current;
      if (!api) return;
      const { scrollX, scrollY, zoom } = api.getAppState();
      const z = zoom.value;
      const [minX, minY, maxX, maxY] = anno.bounds;
      const iconPos = sceneCoordsToViewportCoords(
        { sceneX: minX, sceneY: minY },
        { scrollX, scrollY, zoom: { value: z }, offsetLeft: 0, offsetTop: -30 },
      );
      const box: Box = {
        left: iconPos.x,
        top: iconPos.y + 30,
        w: (maxX - minX) * z,
        h: (maxY - minY) * z,
      };
      return { iconPos, box };
    },
    [],
  );

  const hasAnnosAndAnnoIng = isAnnotating && annos.length > 0;
  return (
    <ToolContainer className="size-full grid grid-rows-[auto_1fr]">
      <div
        className={cn(
          "h-10 flex items-center justify-between px-4  border-b-2",
          hasAnnosAndAnnoIng ? "bg-primary/20 dark:bg-primary/40" : "",
        )}
      >
        <div className="flex gap-1">
          {hasAnnosAndAnnoIng && (
            <>
              <Button variant={"ghost"} size="icon" onClick={toggleAnnotating}>
                <X />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={"ghost"} size="icon">
                    <Trash />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("chat.deleteAnnoTitle")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("chat.deleteAnnoDesc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => clearAnnotations(id)}>
                      {t("common.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
        <div>
          {!isAnnotating && (
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={toggleAnnotating}
              data-active={isAnnotating}
            >
              <MessageCirclePlus />
            </Button>
          )}
          {isAnnotating && annos.length === 0 && (
            <Button
              variant={"outline"}
              size={"default"}
              onClick={toggleAnnotating}
              data-active={isAnnotating}
            >
              <MessageCirclePlus
                className={isAnnotating ? "text-primary" : ""}
              />
              <span className=" text-primary"> {t("chat.annotating")}</span>
            </Button>
          )}
          {isAnnotating && annos.length > 0 && (
            <div className="flex gap-2">
              <Button
                size="icon"
                variant={showAll ? "default" : "outline"}
                onClick={toggleShowAll}
              >
                <Eye />
              </Button>
              <Button variant={"default"}>
                {t("chat.send")}
                <Badge variant="secondary">{annos.length}</Badge>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div ref={exclidrawDivRef} className="relative overflow-hidden">
        <Excalidraw
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          onChange={(elements, appState, files) => {
            // 有存档时:Excalidraw 应用完 initialData 会触发 onChange,此刻场景才算就绪
            if (initialDataLoadedRef.current) setApiReady(true);
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
        ></Excalidraw>

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
        <div className="pointer-events-none">
          {isAnnotating && (
            <>
              {annos.map((anno, i) => {
                // marker 内联渲染 svg，仅对 svg 类型生效；image 类型走 hover card 的 img
                if (anno.type !== "svg") return null;
                const pos = annoedToViewPortPos(anno);
                if (!pos) return null;
                const state: AnnoedMarkerState =
                  editingIdx === i ? "edit" : showAll ? "display" : "collapsed";
                return (
                  <AnnoedMarker
                    key={i}
                    pos={pos}
                    svgXmlStr={anno.svgXmlStr ?? ""}
                    value={anno.text}
                    index={i}
                    state={state}
                    onStartEdit={() => {
                      closeShowAll();
                      setEditingIdx(i);
                    }}
                    onCancelEdit={() => setEditingIdx(null)}
                    onSubmit={(v) => {
                      updateAnnotation(id, i, { text: v });
                    }}
                    onDelete={() => {
                      removeAnnotation(id, i);
                      setEditingIdx(null);
                    }}
                  />
                );
              })}
            </>
          )}
        </div>
      </div>
    </ToolContainer>
  );
};

export default ExclidrawPanel;
