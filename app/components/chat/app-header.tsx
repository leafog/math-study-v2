import { useIsMobile } from "~/hooks/use-mobile";
import { SidebarTrigger } from "../ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { ArrowDown, ArrowDown01, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

import { Item, ItemContent, ItemGroup, ItemTitle } from "../ui/item";

const AppHeader = () => {
  const isMobile = useIsMobile();
  return (
    <div className="px-4 gap-2  size-full flex items-center">
      {isMobile && <SidebarTrigger />}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={"ghost"} size="lg" className="text-xl font-bold">
            <span>deepseek</span>
            <ChevronDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-2">
          <ItemGroup className="gap-1">
            <Item asChild size="xs">
              <a>
                <ItemContent>
                  <ItemTitle>123</ItemTitle>
                </ItemContent>
              </a>
            </Item>
            <Item asChild size="xs">
              <a>
                <ItemContent>
                  <ItemTitle>123</ItemTitle>
                </ItemContent>
              </a>
            </Item>
          </ItemGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AppHeader;
