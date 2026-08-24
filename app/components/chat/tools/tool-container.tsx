import type { HTMLAttributes } from "react";
import { cn } from "~/lib/utils";

type ToolContainerProps = HTMLAttributes<HTMLDivElement>;
export const ToolContainer = ({ className, ...props }: ToolContainerProps) => (
  <div className={cn("flex-1 min-h-0", className)} {...props} />
);
