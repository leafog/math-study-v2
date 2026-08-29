import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useClickAway } from "@uidotdev/usehooks";
import { MessageCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import AnnoComposer from "./anno-composer";

export type AnnoViewportPos = {
  iconPos: { x: number; y: number };
  box: { left: number; top: number; w: number; h: number };
};

type AnnoMarkerProps = {
  pos: AnnoViewportPos;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  /** 初始是否只读（仅显示 MessageCircle）；默认可编辑 */
  initialReadOnly?: boolean;
};

/**
 * 标注标记：选中元素旁的输入区 + 选中区域的虚线框。
 * 只读状态只显示 MessageCircle，点击进入编辑；编辑态显示输入框 + 虚线框，
 * 点击外部(useClickAway)或提交后回到只读。渲染在 Excalidraw 之上(z-3 画布层、z-2 虚线框)。
 */
const AnnoMarker = ({
  pos,
  value,
  onChange,
  onSubmit,
  initialReadOnly = false,
}: AnnoMarkerProps) => {
  const { t } = useTranslation();
  const [isReadOnly, setIsReadOnly] = useState(initialReadOnly);
  const containerRef = useClickAway<HTMLDivElement>(() => setIsReadOnly(true));

  // 与 AnnoedMarker 布局一致：始终显示图标行(Tooltip + MessageCircle)，编辑态才显示输入框
  return (
    <div ref={containerRef}>
      <div
        className="absolute z-[3] cursor-pointer flex items-start gap-2"
        style={{ left: pos.iconPos.x, top: pos.iconPos.y }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <MessageCircle
              className="shrink-0 text-primary"
              fill="currentColor"
              onClick={() => setIsReadOnly(false)}
            />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-64">
            {/* 包在 span 里 truncate:flex 父级下 min-w-0 才收缩出省略号 */}
            <span className="truncate min-w-0">
              {value || t("common.annoEmpty")}
            </span>
          </TooltipContent>
        </Tooltip>
        {!isReadOnly && (
          <AnnoComposer
            value={value}
            onChange={onChange}
            onSubmit={() => {
              setIsReadOnly(true);
              onSubmit();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AnnoMarker;
