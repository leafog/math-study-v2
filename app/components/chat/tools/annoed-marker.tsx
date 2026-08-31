import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickAway } from "@uidotdev/usehooks";
import { MessageCircle, Trash } from "lucide-react";
import type { AnnoViewportPos } from "./anno-marker";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { cn } from "~/lib/utils";

/** 标注标记的三态（受控）：折叠(仅图标) | 展示(图标+tooltip+svg盒) | 编辑(输入框) */
export type AnnoedMarkerState = "collapsed" | "display" | "edit";

type AnnoedMarkerProps = {
  pos: AnnoViewportPos;
  /** 被注释区域的 SVG XML 字符串 */
  svgXmlStr: string;
  value: string;
  /** 标注序号（图标内显示 index+1，标识顺序；同一位置多条也能区分） */
  index: number;
  /** 外部控制的三态（受控组件） */
  state: AnnoedMarkerState;
  onSubmit: (value: string) => void;
  /** 删除本条标注（从列表里删掉自己） */
  onDelete: () => void;
  /** 点击图标 → 父级把 state 切到 "edit" */
  onStartEdit: () => void;
  /** 取消编辑 / 点击外部 → 父级切回 display/collapsed */
  onCancelEdit: () => void;
};

/**
 * 已提交标注标记：受控三态（collapsed/display/edit），状态由父级通过 props 传入。
 * 与 AnnoMarker 一致(只读显示 MessageCircle，点击可编辑)，区别在于"原来画虚线框的地方"
 * 改为渲染注释的 SVG（背景透明）。渲染在 Excalidraw 之上(z-3 图标层、z-2 svg 层)。
 */
const AnnoedMarker = ({
  pos,
  svgXmlStr,
  value,
  index,
  state,
  onSubmit,
  onDelete,
  onStartEdit,
  onCancelEdit,
}: AnnoedMarkerProps) => {
  const { t } = useTranslation();

  // 点击外部：编辑态才取消（避免折叠/展示态误触）
  const containerRef = useClickAway<HTMLDivElement>(() => {
    if (state === "edit") onCancelEdit();
  });

  const isEdit = state === "edit";
  const isDisplay = state === "display";
  // 展示/编辑都显示 svg 盒；折叠态只留图标
  const showBox = state !== "collapsed";
  // 仅展示态显示 tooltip，编辑态隐藏
  const showTooltip = state === "display";

  // 编辑态本地草稿：只影响输入框，不存父级
  const [text, setText] = useState("");
  useEffect(() => {
    setText(value);
  }, [value]);
  useEffect(() => {
    if (isEdit) setText(value);
  }, [isEdit, value]);

  const onInnerSubmit = () => {
    onSubmit(text);
    onCancelEdit();
  };

  return (
    <div ref={containerRef}>
      <div
        className="absolute z-[3] cursor-pointer flex items-start gap-2"
        style={{ left: pos.iconPos.x, top: pos.iconPos.y }}
      >
        <span className="relative shrink-0 cursor-pointer pointer-events-auto   touch-none ">
          <MessageCircle
            className="text-primary"
            fill="currentColor"
            onClick={onStartEdit}
          />
          {/* 图标内显示标注顺序（1 起）：主色圆底 + primary-foreground 数字，同 button primary 配色 */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold leading-none text-primary-foreground">
            {index + 1}
          </span>
        </span>
        {/* 用普通 div 做 tooltip（不用 Radix Tooltip：pan/zoom 频繁重定位会滑动） */}
        {showTooltip && (
          <div className="max-w-64 truncate rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow">
            {value || t("common.annoEmpty")}
          </div>
        )}
      </div>
      {isEdit && (
        // 包裹层锚在 box 上方，向上延伸；输入框贴在 box 顶缘上方、左对齐
        <div
          className="pointer-events-none absolute z-[3] flex flex-col items-start justify-end"
          style={{
            left: pos.box.left + 30,
            top: pos.box.top - 210,
            width: pos.box.w,
            height: 200,
          }}
        >
          <InputGroup
            className={cn(
              "pointer-events-auto max-w-72 min-w-52 rounded-md bg-background dark:bg-background shadow-sm touch-none  ",
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
                    onCancelEdit();
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
            dangerouslySetInnerHTML={{
              __html: svgXmlStr,
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
