import { Maximize, Waypoints } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import ChatKnowledgeGraph from "./chat-kg-graph";
import ChatProblemsList from "./chat-problems-list";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import KnowledgeGraphAll from "../graph/konwledge-graph-all";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const ChatMenuInfo = () => {
  return (
    <Card className="w-72 p-0">
      <CardContent className="px-2">
        <Accordion type="multiple" defaultValue={["graph", "problems"]}>
          <AccordionItem value="graph">
            <AccordionTrigger>
              <span className="text-muted-foreground   font-medium ">
                知识点图谱
              </span>
            </AccordionTrigger>
            <AccordionContent className=" relative w-full h-48">
              <div className=" absolute top-0 right-0 gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant={"ghost"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Waypoints />
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className={"sm:max-w-none max-w-none w-[95vw] h-[90vh]"}
                  >
                    <div className={"size-full"}>
                      <KnowledgeGraphAll />
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant={"ghost"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Maximize />
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className={"sm:max-w-none max-w-none w-[95vw] h-[90vh]"}
                  >
                    <div className={"size-full"}>
                      <ChatKnowledgeGraph />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <ChatKnowledgeGraph />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="problems">
            <AccordionTrigger>
              <span className="text-muted-foreground  font-medium">题目</span>
            </AccordionTrigger>
            <AccordionContent className="w-full h-48 overflow-y-auto scrollbar-thin">
              <ChatProblemsList />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ChatMenuInfo;
