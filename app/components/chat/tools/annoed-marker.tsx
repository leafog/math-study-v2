import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickAway } from "@uidotdev/usehooks";
import { MessageCircle, Trash } from "lucide-react";
import type { AnnoViewportPos } from "./anno-marker";
import { useBoolean } from "usehooks-ts";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { cn } from "~/lib/utils";

type AnnoedMarkerProps = {
  pos: AnnoViewportPos;
  /** 被注释区域的 SVG 元素 */
  svg: SVGElement;
  value: string;
  onSubmit: (value: string) => void;
  /** 删除本条标注（从列表里删掉自己） */
  onDelete: () => void;
  /** 外部"show all"控制：为 true 时展开 svg 盒并打开 tooltip */
  showAll?: boolean;
  /** 进入编辑态(showInput)时通知父级关闭 showAll */
  onShowInput?: () => void;
};

/**
 * 已提交标注标记：与 AnnoMarker 一致(只读显示 MessageCircle，点击可编辑)，
 * 区别在于"原来画虚线框的地方"改为渲染注释的 SVG（背景透明）。
 * 渲染在 Excalidraw 之上(z-3 图标层、z-2 svg 层)。
 */
const AnnoedMarker = ({
  pos,
  svg,
  value,
  onSubmit,
  onDelete,
  showAll = false,
  onShowInput,
}: AnnoedMarkerProps) => {
  const { t } = useTranslation();
  const {
    value: showInput,
    setFalse: closeInput,
    toggle: toggleInput,
  } = useBoolean();
  // tooltip 的悬停态：showAll 强制打开时忽略，由外部控制
  const [hoverOpen, setHoverOpen] = useState(false);
  const containerRef = useClickAway<HTMLDivElement>(() => closeInput());
  const svgBoxRef = useRef<HTMLDivElement>(null);

  // 外部"show all"为 true 时展开 svg 盒并打开 tooltip
  const showBox = showInput || showAll;
  // 编辑态不显示 tooltip；否则跟随 hover 或 showAll
  const showTooltip = showInput ? false : hoverOpen || showAll;

  // 进入编辑态(showInput)时通知父级关闭 showAll
  useEffect(() => {
    if (showInput) {
      onShowInput?.();
    }
  }, [showInput, onShowInput]);

  const [text, setText] = useState("");

  useEffect(() => {
    setText(value);
  }, [value]);
  useEffect(() => {
    if (showInput) {
      setText(value);
    }
  }, [showInput]);
  // 把 svg 元素挂进盒子里显示。用 ref 回调：div 一挂载就同步塞入，
  // 不依赖 effect 时序（svg 盒只在编辑态才挂载）
  const setSvgBox = useCallback(
    (el: HTMLDivElement | null) => {
      svgBoxRef.current = el;
      if (el && svg) {
        el.replaceChildren(svg);
      }
    },
    [svg],
  );
  const onInnerSubmit = () => {
    onSubmit(text);

    closeInput();
  };

  return (
    <div ref={containerRef}>
      <div
        className="absolute z-[3] cursor-pointer flex items-start gap-2"
        style={{ left: pos.iconPos.x, top: pos.iconPos.y }}
      >
        <MessageCircle
          className="shrink-0 text-primary"
          fill="currentColor"
          onClick={toggleInput}
          onMouseEnter={() => {
            if (!showAll) setHoverOpen(true);
          }}
          onMouseLeave={() => {
            if (!showAll) setHoverOpen(false);
          }}
        />
        {/* 用普通 div 做 tooltip（不用 Radix Tooltip：pan/zoom 频繁重定位会滑动） */}
        {showTooltip && (
          <div className="max-w-64 truncate rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow">
            {value || t("common.annoEmpty")}
          </div>
        )}
      </div>
      {showInput && (
        // 包裹层锚在 box 上方，向上延伸；输入框贴在 box 顶缘上方、左对齐
        <div
          className="pointer-events-none absolute z-[4] flex flex-col items-start justify-end"
          style={{
            left: pos.box.left + 30,
            top: pos.box.top - 210,
            width: pos.box.w,
            height: 200,
          }}
        >
          <InputGroup
            className={cn(
              "pointer-events-auto max-w-72 min-w-52 rounded-md bg-background dark:bg-background shadow-sm  ",
            )}
          >
            <InputGroupTextarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
              }}
              className="shrink-0 [field-sizing:content_height] min-h-9 max-h-48 scrollbar-thin"
              onKeyDown={(e) => {
                // Enter 提交（Shift+Enter 换行）
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onInnerSubmit();
                }
              }}
            />
            <InputGroupAddon align={"block-end"}>
              <InputGroupButton variant={"destructive"} onClick={onDelete}>
                <Trash />
              </InputGroupButton>
              <div className="ml-auto flex">
                <InputGroupButton
                  variant="ghost"
                  onClick={() => {
                    setText(value);
                    closeInput();
                  }}
                >
                  {t("common.cancel")}
                </InputGroupButton>
                <InputGroupButton
                  variant="default"
                  onClick={() => {
                    onInnerSubmit();
                  }}
                >
                  {t("common.save")}
                </InputGroupButton>
              </div>
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
      {showBox && (
        <>
          <div
            ref={setSvgBox}
            className="pointer-events-none absolute z-[2]
             ring-1 ring-card/80 dark:ring-primary/60 shadow-lg
            flex items-center justify-center overflow-hidden rounded-lg
               [&>svg]:size-full
              "
            style={{
              left: pos.box.left,
              top: pos.box.top,
              width: pos.box.w,
              height: pos.box.h,
            }}
          ></div>
          {/* 上面的遮盖层：盖在 svg 上，统一着主色 */}
          <div
            className="pointer-events-none absolute z-[3]
             flex items-center justify-center overflow-hidden rounded-lg
             bg-primary/20 dark:bg-primary/40"
            style={{
              left: pos.box.left,
              top: pos.box.top,
              width: pos.box.w,
              height: pos.box.h,
            }}
          />
        </>
      )}
    </div>
  );
};

export default AnnoedMarker;
