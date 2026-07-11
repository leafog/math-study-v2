import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { Item, ItemContent, ItemMedia } from "~/components/ui/item";

export const ToolExclidrawItem = () => {
  return (
    <Item>
      <ItemMedia></ItemMedia>
      <ItemContent></ItemContent>
    </Item>
  );
};
const ToolExclidraw = () => {
  return (
    <div className="size-full">
      <Excalidraw gridModeEnabled />
    </div>
  );
};

export default ToolExclidraw;
