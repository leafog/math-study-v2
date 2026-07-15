import { Pen, type LucideProps } from "lucide-react";
import type {
  ComponentType,
  ForwardRefExoticComponent,
  RefAttributes,
} from "react";

export type ToolDefinition = {
  kind: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  Panel: ComponentType;
};
