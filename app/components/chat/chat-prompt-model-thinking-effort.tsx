import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "../ui/dropdown-menu";

const ChatPromptModelThinkingEffort = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className=" rounded-full" variant={"outline"}>
          推理强度
        </Button>
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
};

export default ChatPromptModelThinkingEffort;
