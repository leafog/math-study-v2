import type { LucideProps } from "lucide-react";
import type {
  ComponentType,
  ForwardRefExoticComponent,
  LazyExoticComponent,
  RefAttributes,
} from "react";

export type ToolPanelProps = {
  id: string;
  chatId: string;
  kind: string;
  refId?: string;
  init?: unknown;
  onChange?: (value: unknown) => void;
};

export type ToolPanel = ComponentType<ToolPanelProps>;

export type ToolInfo = {
  kind: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  showInOpen: boolean;
  Panel: LazyExoticComponent<ToolPanel>;
};
export type Tools = Record<string, ToolInfo>;
