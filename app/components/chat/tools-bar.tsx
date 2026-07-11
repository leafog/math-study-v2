import ToolTab from "./tool-tab";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

const ToolsBar = () => {
  return (
    <div className="flex h-full min-w-0 flex-row items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth overscroll-none">
      <ToolTab title="title" active onClose={() => {}} />
      <Separator orientation="vertical" className="self-center scale-y-60" />
      <ToolTab title="title2" />
      <Separator orientation="vertical" className="self-center scale-y-60" />
      <ToolTab title="title2" />
      <Separator orientation="vertical" className="self-center scale-y-60" />
      <div className="sticky right-0 pr-2 bg-background">
        <Button size="icon" variant={"ghost"}>
          <Plus />
        </Button>
      </div>
    </div>
  );
};

export default ToolsBar;
