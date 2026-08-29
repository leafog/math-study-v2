import { CheckIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "~/components/ui/input-group";
import { useMeasure } from "@uidotdev/usehooks";
import { cn } from "~/lib/utils";

type AnnoComposerProps = {
  value: string;
  onChange: (value: string) => void;
  /** 点提交按钮或按 Enter(非 Shift)时触发 */
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
};

/**
 * 标注输入区：textarea 自动增高，addon 随单/多行切换布局。
 *
 * 多行判定：固定 textarea 宽度(与 align 无关)，用 field-sizing 只让高度随内容
 * 自动增高，再以 useMeasure 测高度。因为宽度在 inline/block 两种布局下恒定，
 * 高度只由文本决定 → align 切换不再反过来改宽度 → 不会振荡跳动。
 * Enter = 提交，Shift+Enter = 换行。
 */
const AnnoComposer = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Enter your message",
  className,
}: AnnoComposerProps) => {
  const [ref, { height }] = useMeasure();
  // 固定宽度 + 高度随内容；单行约 36px(min-h-9)，两行即超过 40
  const isMultiline = (height ?? 0) > 40;
  return (
    <InputGroup
      className={cn(
        "max-w-72 min-w-52 rounded-md bg-background dark:bg-background shadow-sm ",
        className,
      )}
    >
      <InputGroupTextarea
        ref={ref}
        value={value}
        placeholder={placeholder}
        className={cn(
          "w-60 shrink-0 [field-sizing:content_height] min-h-9 max-h-48 scrollbar-thin",
        )}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          // Enter 提交（Shift+Enter 换行）
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <InputGroupAddon align={isMultiline ? "block-end" : "inline-end"}>
        <InputGroupButton
          variant="default"
          size="icon-sm"
          className="ml-auto"
          onClick={onSubmit}
        >
          <CheckIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};

export default AnnoComposer;
