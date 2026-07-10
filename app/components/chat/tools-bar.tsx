import ToolTab from "./tool-tab";
import { Separator } from "../ui/separator";

const ToolsBar = () => {
  return (
    <div className="flex h-full min-w-0 flex-row items-center gap-2 overflow-x-auto scrollbar-none scroll-smooth">
      <ToolTab title="title" active onClose={() => {}} />
      <Separator
        orientation="vertical"

        className="self-center scale-y-60"
      />
      <ToolTab title="title2" />
      <Separator orientation="vertical" className="self-center scale-y-60" />
      <ToolTab title="title2" />
    </div>
  );
};

export default ToolsBar;
