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
  const containerRef = useClickAway<HTMLDivElement>(() =>
    setIsReadOnly(true),
  );

  // 只读：仅显示 MessageCircle，点击进入编辑
  if (isReadOnly) {
    return (
      <div
        ref={containerRef}
        className="absolute z-[3] cursor-pointer"
        style={{ left: pos.iconPos.x, top: pos.iconPos.y }}
        onClick={() => setIsReadOnly(false)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <MessageCircle className="text-primary" />
          </TooltipTrigger>
          <TooltipContent side="right">
            {value || t("common.annoEmpty")}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <div
        className="absolute z-[3] flex items-start gap-2"
        style={{ left: pos.iconPos.x, top: pos.iconPos.y }}
      >
        <MessageCircle className="text-primary" />
        <AnnoComposer
          value={value}
          onChange={onChange}
          onSubmit={() => {
            setIsReadOnly(true);
            onSubmit();
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute z-[2]"
        style={{
          left: pos.box.left,
          top: pos.box.top,
          width: pos.box.w,
          height: pos.box.h,
        }}
      >
        <div className="absolute inset-x-0 top-0 border-t-2 border-dashed border-primary" />
        <div className="absolute inset-x-0 bottom-0 border-b-2 border-dashed border-primary" />
        <div className="absolute inset-y-0 left-0 border-l-2 border-dashed border-primary" />
        <div className="absolute inset-y-0 right-0 border-r-2 border-dashed border-primary" />
      </div>
    </div>
  );
};

export default AnnoMarker;
