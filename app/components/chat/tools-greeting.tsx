import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "../ui/item";

const ToolsGreeting = () => {
  return (
    <div className="flex flex-1 size-full justify-center items-center">
      <div className="flex flex-col min-w-xs max-w-md w-full p-4 gap-2">
        <ItemGroup className="gap-2">
          <Item variant={"outline"}>
            <ItemContent className="gap-1">
              <ItemTitle>look here </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PlusIcon />
              </Button>
            </ItemActions>
          </Item>
          <Item variant={"outline"}>
            <ItemContent className="gap-1">
              <ItemTitle>look here </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PlusIcon />
              </Button>
            </ItemActions>
          </Item>
          <Item variant={"outline"}>
            <ItemContent className="gap-1">
              <ItemTitle>look here </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PlusIcon />
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
        <div className="p-2"> 推荐</div>
        <ItemGroup className="gap-2">
          <Item variant={"outline"}>
            <ItemContent className="gap-1">
              <ItemTitle>look here </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Button variant="ghost" size="icon" className="rounded-full">
                <PlusIcon />
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </div>
    </div>
  );
};

export default ToolsGreeting;
