import { PlusIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { ItemGroup, ItemTitle } from "../ui/item";

const ToolsGreeting = () => {
  return (
    <div className="flex flex-1 size-full justify-center items-center">
      <div className="flex flex-col min-w-xs max-w-lg w-full p-4 gap-2">
        <div className=" flex flex-col gap-2">
          <Button
            className="w-full justify-start"
            size="lg"
            variant={"outline"}
          >
            <X />
            <span>titl松动的sse</span>
          </Button>
          <Button
            className="w-full justify-start"
            size="lg"
            variant={"outline"}
          >
            <X />
            <span>titl松动的sse</span>
          </Button>
          <Button
            className="w-full justify-start"
            size="lg"
            variant={"outline"}
          >
            <X />
            <span>titl松动的sse</span>
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="pl-2">推荐</span>
          <Button className="w-full justify-start" size="lg" variant={"ghost"}>
            <X />
            <span>titl松动的sse</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToolsGreeting;
