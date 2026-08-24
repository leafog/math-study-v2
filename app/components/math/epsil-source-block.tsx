import { useMemo } from "react";
import { cn } from "~/lib/utils";
import { highlightEpsil } from "~/lib/highlight/epsil-highlight";

interface EpsilSourceBlockProps {
  /** epsil 源码(或 markdown 渲染里的子文本) */
  children: string;
  /** 透传给外层容器的 class */
  className?: string;
  /** 最大高度,超出滚动;默认 20rem */
  maxHeight?: string | number;
}

/**
 * 展示 epsil 源码,带 @tanstack/highlight 语法高亮(GitHub 主题,跟随 dark 切换)。
 * 与 tool-epsli 的实时预览共用同一 highlighter 单例与 token 样式。
 */
const EpsilSourceBlock = ({
  children,
  className,
  maxHeight = "20rem",
}: EpsilSourceBlockProps) => {
  const html = useMemo(() => highlightEpsil(children), [children]);

  if (!html) return null;

  return (
    <div
      className={cn("overflow-auto rounded-md border bg-muted/40", className)}
      style={{ maxHeight }}
    >
      <pre
        className="p-3 font-mono text-sm leading-relaxed whitespace-pre"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

export default EpsilSourceBlock;
