import { memo, type ComponentProps } from "react";
import { cn } from "~/lib/utils";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "./streamdown-math";

export type MathResProps = ComponentProps<typeof Streamdown>;

// MessageResponse 的同构实现(不改动 ai-elements),但 math 插件使用带公式级
// KaTeX 缓存的版本,避免切换会话时重复渲染相同公式。
const streamdownPlugins = { cjk, code, math, mermaid };

const MathRes = memo(
  ({ className, ...props }: MathResProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    nextProps.isAnimating === prevProps.isAnimating,
);

MathRes.displayName = "MathRes";

export default MathRes;
