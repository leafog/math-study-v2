import { Button } from "../ui/button";
import { PanelRight, PanelRightDashed } from "lucide-react";

interface ToolsTriggerProps {
  onTrigger: VoidFunction;
  inTools?: boolean;
}

const ToolsTrigger = ({ onTrigger, inTools = false }: ToolsTriggerProps) => {
  return (
    <Button
      size="icon"
      variant={inTools ? "outline" : "ghost"}
      onClick={onTrigger}
    >
      {inTools ? <PanelRight /> : <PanelRightDashed />}
    </Button>
  );
};

export default ToolsTrigger;
