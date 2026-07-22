import { Pen, type LucideProps } from "lucide-react";
import type {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";

export type ToolPanelProps = {
  id: string;
  chatId: string;
  kind: string;
  init?: unknown;
  onChange?: (value: unknown) => void;
};

export type ToolDefinition = {
  kind: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  Panel: ComponentType<ToolPanelProps>;
};
