import type { ReactNode } from "react";
import { ToolCase, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";

interface ToolTabProps {
  title: string;
  active?: boolean;
  icon?: ReactNode;
  onClose?: () => void;
}

const ToolTab = ({ title, active, icon, onClose }: ToolTabProps) => {
  return (
    <div
      className={cn(
        "group px-1.5 py-1 rounded-sm hover:bg-accent flex h-8",
        active && "bg-secondary",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        {icon ?? <ToolCase size={16} />}
        <span className="min-w-20 text-sm">{title}</span>
        {onClose && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            className="opacity-0 group-hover:opacity-100"
          >
            <X />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ToolTab;
